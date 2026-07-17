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
exports.MaterialReservationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const PRIORITY_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 };
let MaterialReservationService = class MaterialReservationService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async reserveForWorkOrder(workOrderId, user) {
        const wo = await this.prisma.workOrder.findUnique({
            where: { id: workOrderId },
            include: { bom: { include: { items: { where: { isActive: true } } } } },
        });
        if (!wo || !wo.bom)
            return [];
        const results = [];
        for (const bomItem of wo.bom.items) {
            const requiredQty = (bomItem.effectiveQty || bomItem.quantity) * wo.plannedQty;
            let stillNeeded = requiredQty;
            const stock = await this.prisma.stockBalance.findUnique({
                where: {
                    companyId_itemCode_warehouseId: {
                        companyId: wo.companyId,
                        itemCode: bomItem.itemCode,
                        warehouseId: wo.warehouseId,
                    },
                },
            });
            const freeQty = Math.min((stock === null || stock === void 0 ? void 0 : stock.availableQty) || 0, stillNeeded);
            if (freeQty > 0 && stock) {
                await this.prisma.stockBalance.update({
                    where: { id: stock.id },
                    data: { availableQty: { decrement: freeQty }, reservedQty: { increment: freeQty } },
                });
                await this.prisma.materialReservation.create({
                    data: {
                        companyId: wo.companyId, workOrderId, itemCode: bomItem.itemCode,
                        itemName: bomItem.itemName, warehouseId: wo.warehouseId,
                        reservedQty: freeQty, status: 'ACTIVE',
                        createdBy: user.id, updatedBy: user.id,
                    },
                });
                stillNeeded -= freeQty;
            }
            if (stillNeeded > 0.0001) {
                const candidates = await this.prisma.materialReservation.findMany({
                    where: {
                        itemCode: bomItem.itemCode, warehouseId: wo.warehouseId,
                        status: 'ACTIVE', companyId: wo.companyId,
                        workOrderId: { not: workOrderId },
                    },
                    include: { workOrder: true },
                });
                const eligible = candidates
                    .filter(r => !['COMPLETED', 'CANCELLED'].includes(r.workOrder.status) &&
                    (PRIORITY_RANK[r.workOrder.priority] || 2) < (PRIORITY_RANK[wo.priority] || 2))
                    .sort((a, b) => (PRIORITY_RANK[a.workOrder.priority] || 2) - (PRIORITY_RANK[b.workOrder.priority] || 2)
                    || a.createdAt.getTime() - b.createdAt.getTime());
                for (const cand of eligible) {
                    if (stillNeeded <= 0.0001)
                        break;
                    const issuedAgg = await this.prisma.productionIssueItem.aggregate({
                        where: {
                            itemCode: bomItem.itemCode,
                            productionIssue: { workOrderId: cand.workOrderId, status: 'ISSUED' },
                        },
                        _sum: { issuedQty: true },
                    });
                    const alreadyIssued = issuedAgg._sum.issuedQty || 0;
                    const reallocatable = Math.max(0, cand.reservedQty - alreadyIssued);
                    if (reallocatable <= 0.0001)
                        continue;
                    const takeQty = Math.min(reallocatable, stillNeeded);
                    if (takeQty >= cand.reservedQty - 0.0001) {
                        await this.prisma.materialReservation.update({
                            where: { id: cand.id },
                            data: { status: 'RELEASED', releasedReason: `Reallocated to higher-priority WO ${wo.woNumber}`, updatedBy: user.id },
                        });
                    }
                    else {
                        await this.prisma.materialReservation.update({
                            where: { id: cand.id },
                            data: { reservedQty: { decrement: takeQty } },
                        });
                    }
                    await this.prisma.materialReservation.create({
                        data: {
                            companyId: wo.companyId, workOrderId, itemCode: bomItem.itemCode,
                            itemName: bomItem.itemName, warehouseId: wo.warehouseId,
                            reservedQty: takeQty, status: 'ACTIVE',
                            releasedReason: `Reallocated from WO ${cand.workOrder.woNumber} (priority ${wo.priority} > ${cand.workOrder.priority})`,
                            createdBy: user.id, updatedBy: user.id,
                        },
                    });
                    await this.audit.log({
                        tableName: 'material_reservations', recordId: cand.id, action: 'UPDATE',
                        oldValues: { workOrder: cand.workOrder.woNumber, itemCode: bomItem.itemCode, qty: takeQty },
                        newValues: { reallocatedTo: wo.woNumber, reason: 'higher priority' },
                        changedBy: user.id,
                    });
                    stillNeeded -= takeQty;
                }
            }
            results.push({
                itemCode: bomItem.itemCode, itemName: bomItem.itemName,
                requiredQty, reservedQty: requiredQty - stillNeeded, shortfallQty: Math.max(0, stillNeeded),
            });
        }
        return results;
    }
    async findForWorkOrder(workOrderId) {
        return this.prisma.materialReservation.findMany({
            where: { workOrderId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findAll(user, query) {
        const where = { companyId: user.companyId };
        if (query.itemCode)
            where.itemCode = query.itemCode;
        if (query.warehouseId)
            where.warehouseId = query.warehouseId;
        if (query.status)
            where.status = query.status;
        return this.prisma.materialReservation.findMany({
            where,
            include: { workOrder: { select: { woNumber: true, priority: true, status: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }
};
exports.MaterialReservationService = MaterialReservationService;
exports.MaterialReservationService = MaterialReservationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], MaterialReservationService);
//# sourceMappingURL=material-reservation.service.js.map