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
        const laborHours = entries.reduce((s, e) => s + (e.actualLabourHours || 0), 0);
        const laborCost = entries.reduce((s, e) => s + (e.actualLabourCost || 0), 0);
        const laborRatePerHour = laborHours > 0 ? laborCost / laborHours : 0;
        const reworks = await this.prisma.rework.findMany({ where: { workOrderId, companyId, isActive: true } });
        const reworkCost = reworks.reduce((s, r) => s + (r.totalAdditionalCost || 0), 0);
        const scraps = await this.prisma.scrap.findMany({ where: { workOrderId, companyId, isActive: true } });
        const scrapRecovery = scraps.reduce((s, r) => s + (r.recognizedScrapRecovery || 0), 0);
        const fgReceipts = await this.prisma.fgReceipt.findMany({
            where: { workOrderId, companyId, sourceProductionQcId: { not: null } },
        });
        const finalGoodFgQty = fgReceipts.reduce((s, r) => s + (r.receivedQty || 0), 0);
        const overheadCost = 0;
        const otherCost = 0;
        const grossActualCost = materialCost + laborCost + reworkCost + overheadCost + otherCost;
        const netActualCost = grossActualCost - scrapRecovery;
        const totalCost = grossActualCost;
        const completedQty = wo.completedQty || 0;
        const unitCost = finalGoodFgQty > 0 ? netActualCost / finalGoodFgQty : 0;
        const varianceCost = totalCost - plannedMaterialCost;
        const costSheetNumber = await this.generateNumber(companyId);
        const sheet = await this.prisma.productionCostSheet.create({
            data: {
                costSheetNumber, workOrderId, companyId,
                materialCost, plannedMaterialCost,
                totalShifts, laborHours, laborRatePerHour, laborCost,
                reworkCost, scrapRecovery, grossActualCost, netActualCost, finalGoodFgQty,
                overheadCost, otherCost,
                totalCost, completedQty, unitCost, varianceCost,
                createdBy: user.id, updatedBy: user.id,
            },
            include: { workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true, completedQty: true } } },
        });
        if (finalGoodFgQty > 0) {
            await this.prisma.fgReceipt.updateMany({
                where: { workOrderId, companyId, sourceProductionQcId: { not: null } },
                data: { unitCost, updatedBy: user.id },
            });
        }
        await this.audit.log({ tableName: 'production_cost_sheets', recordId: sheet.id, action: 'CREATE', newValues: sheet, changedBy: user.id });
        return sheet;
    }
    async validateClosure(workOrderId, user) {
        const wo = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, companyId: user.companyId } });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        const blockers = [];
        const label = wo.stageName || wo.woNumber;
        if (wo.stageStatus === 'PAUSED' || wo.stageStatus === 'MANPOWER_HOLD') {
            blockers.push(`${label} - production is not in a closeable state (${wo.stageStatus})`);
        }
        const wip = (wo.cumulativeInputQty || 0) - (wo.cumulativeProcessedQty || 0);
        if (wip > 0) {
            blockers.push(`${label} - ${wip} PCS UNRESOLVED WIP`);
        }
        const openDowntime = await this.prisma.downtime.findFirst({ where: { workOrderId, companyId: user.companyId, status: 'OPEN' } });
        if (openDowntime)
            blockers.push(`Open downtime record (${openDowntime.reason}) not resumed`);
        const pendingQc = await this.prisma.productionQc.count({ where: { workOrderId, companyId: user.companyId, status: 'PENDING' } });
        if (pendingQc > 0)
            blockers.push(`${pendingQc} QC inspection(s) still PENDING`);
        const holdAgg = await this.prisma.productionQc.aggregate({ where: { workOrderId, companyId: user.companyId }, _sum: { holdQty: true } });
        if ((holdAgg._sum.holdQty || 0) > 0)
            blockers.push(`${holdAgg._sum.holdQty} PCS QC HOLD unresolved`);
        const openRework = await this.prisma.rework.count({
            where: { workOrderId, companyId: user.companyId, isActive: true, status: { in: ['REWORK_PENDING', 'IN_REWORK', 'PENDING_QC_REINSPECTION'] } },
        });
        if (openRework > 0)
            blockers.push(`${openRework} rework record(s) not yet resolved`);
        const openScrap = await this.prisma.scrap.count({ where: { workOrderId, companyId: user.companyId, isActive: true, status: 'PENDING_DISPOSITION' } });
        if (openScrap > 0)
            blockers.push(`${openScrap} final rejection record(s) pending disposition`);
        return { passed: blockers.length === 0, blockers };
    }
    async closeWorkOrder(workOrderId, user) {
        const wo = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, companyId: user.companyId } });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        if (wo.closedAt)
            throw new common_1.BadRequestException('Work order is already closed');
        const validation = await this.validateClosure(workOrderId, user);
        if (!validation.passed) {
            throw new common_1.BadRequestException(`WO cannot be closed: ${validation.blockers.join('; ')}`);
        }
        let sheet = await this.prisma.productionCostSheet.findUnique({ where: { workOrderId } });
        if (!sheet) {
            sheet = await this.generateFromWo(workOrderId, user);
        }
        if (sheet.status !== 'FINALIZED') {
            sheet = await this.finalize(sheet.id, user);
        }
        const updatedWo = await this.prisma.workOrder.update({
            where: { id: workOrderId },
            data: { status: 'COMPLETED', closedAt: new Date(), closedById: user.id, updatedBy: user.id },
        });
        await this.audit.log({
            tableName: 'work_orders', recordId: workOrderId, action: 'UPDATE',
            newValues: { status: 'COMPLETED', closedAt: updatedWo.closedAt, netActualCost: sheet.netActualCost, finalGoodFgQty: sheet.finalGoodFgQty },
            changedBy: user.id,
        });
        return { workOrder: updatedWo, costSheet: sheet, validation };
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