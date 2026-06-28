"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MrpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MrpService = class MrpService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateMrp(woId, user) {
        var _a;
        const companyId = user.companyId;
        const wo = await this.prisma.workOrder.findFirst({
            where: { id: woId, companyId },
            include: { warehouse: { select: { name: true } } },
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        if (!wo.bomId)
            throw new common_1.BadRequestException('Work order has no BOM linked');
        if (['COMPLETED', 'CANCELLED'].includes(wo.status)) {
            throw new common_1.BadRequestException('Cannot run MRP for completed/cancelled work order');
        }
        const bom = await this.prisma.bom.findFirst({
            where: { id: wo.bomId, companyId },
            include: { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } },
        });
        if (!bom)
            throw new common_1.NotFoundException('BOM not found');
        const requirements = [];
        let hasShortage = false;
        for (const item of bom.items) {
            const grossQty = item.effectiveQty * wo.plannedQty;
            const wasteQty = (item.wastagePercent || 0) / 100 * grossQty;
            const netRequired = grossQty + wasteQty;
            const balance = await this.prisma.stockBalance.findFirst({
                where: { companyId, itemCode: item.itemCode },
            });
            const availableQty = (balance === null || balance === void 0 ? void 0 : balance.availableQty) || 0;
            const batches = await this.prisma.stockBatch.findMany({
                where: { companyId, itemCode: item.itemCode, status: 'ACTIVE', availableQty: { gt: 0 } },
                orderBy: { receivedDate: 'asc' },
                select: { batchNumber: true, availableQty: true, expiryDate: true, receivedDate: true },
            });
            const shortage = Math.max(0, netRequired - availableQty);
            if (shortage > 0)
                hasShortage = true;
            requirements.push({
                sequence: item.sequence,
                itemCode: item.itemCode,
                itemName: item.itemName,
                uom: item.uom,
                itemType: item.itemType,
                qtyPer: item.quantity,
                wastagePercent: item.wastagePercent || 0,
                grossRequired: grossQty,
                netRequired: Math.round(netRequired * 1000) / 1000,
                availableQty,
                shortage: Math.round(shortage * 1000) / 1000,
                status: shortage > 0 ? 'SHORTAGE' : availableQty === 0 ? 'NO_STOCK' : 'AVAILABLE',
                batches: batches.slice(0, 5),
            });
        }
        return {
            workOrder: {
                id: wo.id, woNumber: wo.woNumber, productCode: wo.productCode,
                productName: wo.productName, plannedQty: wo.plannedQty,
                status: wo.status, warehouse: (_a = wo.warehouse) === null || _a === void 0 ? void 0 : _a.name,
            },
            bom: { bomNumber: bom.bomNumber, version: bom.version },
            requirements,
            summary: {
                totalComponents: requirements.length,
                availableComponents: requirements.filter(r => r.status === 'AVAILABLE').length,
                shortageComponents: requirements.filter(r => r.status === 'SHORTAGE').length,
                noStockComponents: requirements.filter(r => r.status === 'NO_STOCK').length,
                hasShortage,
                canProduce: !hasShortage,
            },
        };
    }
    async getShortageReport(user) {
        var _a;
        const companyId = user.companyId;
        const activeWOs = await this.prisma.workOrder.findMany({
            where: { companyId, status: { in: ['RELEASED', 'IN_PROGRESS'] }, bomId: { not: null } },
            include: { warehouse: { select: { name: true } } },
        });
        const report = [];
        for (const wo of activeWOs) {
            try {
                const mrp = await this.calculateMrp(wo.id, user);
                if (mrp.summary.hasShortage) {
                    report.push({
                        woNumber: wo.woNumber, productCode: wo.productCode,
                        productName: wo.productName, plannedQty: wo.plannedQty,
                        status: wo.status, warehouse: (_a = wo.warehouse) === null || _a === void 0 ? void 0 : _a.name,
                        shortageItems: mrp.requirements.filter(r => r.shortage > 0).map(r => ({
                            itemCode: r.itemCode, itemName: r.itemName, uom: r.uom,
                            required: r.netRequired, available: r.availableQty, shortage: r.shortage,
                        })),
                    });
                }
            }
            catch (e) { }
        }
        return { data: report, totalWOs: activeWOs.length, wosWithShortage: report.length };
    }
    async getMaterialPlan(user, query) {
        const companyId = user.companyId;
        const { status = 'RELEASED' } = query;
        const wos = await this.prisma.workOrder.findMany({
            where: { companyId, status: { in: status.split(',') }, bomId: { not: null } },
        });
        const aggregate = {};
        for (const wo of wos) {
            try {
                const mrp = await this.calculateMrp(wo.id, user);
                for (const req of mrp.requirements) {
                    const key = req.itemCode;
                    if (!aggregate[key]) {
                        aggregate[key] = {
                            itemCode: req.itemCode, itemName: req.itemName, uom: req.uom,
                            totalRequired: 0, totalAvailable: req.availableQty,
                            totalShortage: 0, woCount: 0,
                        };
                    }
                    aggregate[key].totalRequired += req.netRequired;
                    aggregate[key].totalShortage = Math.max(0, aggregate[key].totalRequired - aggregate[key].totalAvailable);
                    aggregate[key].woCount += 1;
                }
            }
            catch (e) { }
        }
        const data = Object.values(aggregate).sort((a, b) => b.totalShortage - a.totalShortage);
        return { data, totalWOs: wos.length, totalItems: data.length };
    }
};
exports.MrpService = MrpService;
exports.MrpService = MrpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MrpService);
//# sourceMappingURL=mrp.service.js.map