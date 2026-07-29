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
exports.CostSheetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let CostSheetService = class CostSheetService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.productionCostSheet.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `PCS-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async generateFromWo(workOrderId, user) {
        const companyId = user.companyId;
        const wo = await this.prisma.workOrder.findFirst({
            where: { id: workOrderId, companyId },
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        if (!['IN_PROGRESS', 'COMPLETED'].includes(wo.status)) {
            throw new common_1.BadRequestException('Work order must be IN_PROGRESS or COMPLETED');
        }
        const existing = await this.prisma.productionCostSheet.findUnique({
            where: { workOrderId },
        });
        if (existing)
            return existing;
        const issueItems = await this.prisma.productionIssueItem.findMany({
            where: { companyId, productionIssue: { workOrderId, status: 'ISSUED' } },
        });
        const materialCost = issueItems.reduce((s, i) => s + (i.issuedQty * i.unitCost), 0);
        let plannedMaterialCost = 0;
        if (wo.bomId) {
            const bom = await this.prisma.bom.findFirst({
                where: { id: wo.bomId }, include: { items: { where: { isActive: true } } },
            });
            if (bom) {
                plannedMaterialCost = bom.items.reduce((s, i) => s + (i.effectiveQty * wo.plannedQty * (i.unitCost || 0)), 0);
            }
        }
        const entries = await this.prisma.productionEntry.findMany({
            where: { workOrderId, companyId, status: 'CONFIRMED' },
        });
        const totalShifts = entries.length;
        const laborHours = totalShifts * 8;
        const laborRatePerHour = 50;
        const laborCost = laborHours * laborRatePerHour;
        const totalCost = materialCost + laborCost;
        const completedQty = wo.completedQty || 0;
        const unitCost = completedQty > 0 ? totalCost / completedQty : 0;
        const varianceCost = totalCost - plannedMaterialCost;
        const costSheetNumber = await this.generateNumber(companyId);
        const sheet = await this.prisma.productionCostSheet.create({
            data: {
                costSheetNumber, workOrderId, companyId,
                materialCost, plannedMaterialCost,
                totalShifts, laborHours, laborRatePerHour, laborCost,
                overheadCost: 0, otherCost: 0,
                totalCost, completedQty, unitCost, varianceCost,
                createdBy: user.id, updatedBy: user.id,
            },
            include: { workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true, completedQty: true } } },
        });
        await this.prisma.fgReceipt.updateMany({
            where: { workOrderId, companyId },
            data: { unitCost, totalCost: unitCost * (wo.completedQty || 0), updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'production_cost_sheets', recordId: sheet.id, action: 'CREATE', newValues: sheet, changedBy: user.id });
        return sheet;
    }
    async update(id, dto, user) {
        var _a, _b;
        const sheet = await this.prisma.productionCostSheet.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!sheet)
            throw new common_1.NotFoundException('Cost sheet not found');
        if (sheet.status === 'FINALIZED')
            throw new common_1.BadRequestException('Cannot edit finalized cost sheet');
        const laborCost = dto.laborCost !== undefined ? dto.laborCost :
            (dto.laborHours || sheet.laborHours) * (dto.laborRatePerHour || sheet.laborRatePerHour);
        const totalCost = sheet.materialCost + laborCost +
            ((_a = dto.overheadCost) !== null && _a !== void 0 ? _a : sheet.overheadCost) + ((_b = dto.otherCost) !== null && _b !== void 0 ? _b : sheet.otherCost);
        const unitCost = sheet.completedQty > 0 ? totalCost / sheet.completedQty : 0;
        const varianceCost = totalCost - sheet.plannedMaterialCost;
        const updated = await this.prisma.productionCostSheet.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { laborCost, totalCost, unitCost, varianceCost, updatedBy: user.id }),
            include: { workOrder: { select: { woNumber: true, productCode: true, productName: true } } },
        });
        await this.prisma.fgReceipt.updateMany({
            where: { workOrderId: sheet.workOrderId, companyId: user.companyId },
            data: { unitCost, totalCost: unitCost * sheet.completedQty, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'production_cost_sheets', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async finalize(id, user) {
        const sheet = await this.prisma.productionCostSheet.findFirst({ where: { id, companyId: user.companyId } });
        if (!sheet)
            throw new common_1.NotFoundException('Cost sheet not found');
        if (sheet.status === 'FINALIZED')
            throw new common_1.BadRequestException('Already finalized');
        return this.prisma.productionCostSheet.update({
            where: { id }, data: { status: 'FINALIZED', updatedBy: user.id },
            include: { workOrder: { select: { woNumber: true, productName: true } } },
        });
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.productionCostSheet.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { workOrder: { select: { woNumber: true, productCode: true, productName: true, completedQty: true } } },
            }),
            this.prisma.productionCostSheet.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const sheet = await this.prisma.productionCostSheet.findFirst({
            where: { id, companyId: user.companyId },
            include: { workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true, completedQty: true, bomId: true } } },
        });
        if (!sheet)
            throw new common_1.NotFoundException('Cost sheet not found');
        const issueItems = await this.prisma.productionIssueItem.findMany({
            where: { companyId: user.companyId, productionIssue: { workOrderId: sheet.workOrderId, status: 'ISSUED' } },
        });
        return Object.assign(Object.assign({}, sheet), { materialBreakdown: issueItems });
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, finalized] = await Promise.all([
            this.prisma.productionCostSheet.count({ where }),
            this.prisma.productionCostSheet.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.productionCostSheet.count({ where: Object.assign(Object.assign({}, where), { status: 'FINALIZED' }) }),
        ]);
        const totals = await this.prisma.productionCostSheet.aggregate({
            where, _sum: { totalCost: true, materialCost: true, laborCost: true, overheadCost: true },
            _avg: { unitCost: true },
        });
        return {
            total, draft, finalized,
            totalCost: totals._sum.totalCost || 0,
            totalMaterialCost: totals._sum.materialCost || 0,
            totalLaborCost: totals._sum.laborCost || 0,
            totalOverheadCost: totals._sum.overheadCost || 0,
            avgUnitCost: totals._avg.unitCost || 0,
        };
    }
};
exports.CostSheetService = CostSheetService;
exports.CostSheetService = CostSheetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], CostSheetService);
//# sourceMappingURL=cost-sheet.service.js.map