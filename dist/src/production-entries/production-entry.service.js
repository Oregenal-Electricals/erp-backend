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
exports.ProductionEntryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const material_reservation_service_1 = require("../work-orders/material-reservation.service");
const settings_service_1 = require("../settings/settings.service");
let ProductionEntryService = class ProductionEntryService {
    constructor(prisma, audit, materialReservation, settings) {
        this.prisma = prisma;
        this.audit = audit;
        this.materialReservation = materialReservation;
        this.settings = settings;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.productionEntry.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `PE-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true, completedQty: true, status: true, stageName: true } },
        };
    }
    async create(dto, user) {
        const wo = await this.prisma.workOrder.findFirst({
            where: { id: dto.workOrderId, companyId: user.companyId },
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        if (wo.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException('Work order must be IN_PROGRESS to record production');
        }
        if (wo.stageStatus === 'MANPOWER_HOLD') {
            throw new common_1.BadRequestException('This stage has zero active manpower (MANPOWER_HOLD) - restore manpower before recording further production');
        }
        const periodStart = new Date(dto.periodStart);
        const periodEnd = new Date(dto.periodEnd);
        if (periodEnd <= periodStart)
            throw new common_1.BadRequestException('Period end must be after period start');
        const now = new Date();
        if (periodEnd > now)
            throw new common_1.BadRequestException('Cannot record production for a future time period');
        if (wo.actualStartDate && periodStart < wo.actualStartDate) {
            throw new common_1.BadRequestException(`Entry period cannot start before this stage's actual start time (${wo.actualStartDate.toISOString()})`);
        }
        const overlapping = await this.prisma.productionEntry.findFirst({
            where: {
                workOrderId: dto.workOrderId, companyId: user.companyId, isActive: true,
                periodStart: { lt: periodEnd }, periodEnd: { gt: periodStart },
            },
        });
        if (overlapping)
            throw new common_1.BadRequestException(`This period overlaps with an existing entry (${overlapping.entryNumber})`);
        const durationHours = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
        let manpowerQty = dto.manpowerQty;
        if (manpowerQty === undefined) {
            const approvedAllocation = await this.prisma.manpowerAllocation.findFirst({
                where: { companyId: user.companyId, workOrderId: dto.workOrderId, status: 'APPROVED', isActive: true },
            });
            manpowerQty = (approvedAllocation === null || approvedAllocation === void 0 ? void 0 : approvedAllocation.count) || 0;
        }
        const goodQty = dto.goodQty;
        const scrapQty = dto.scrapQty || 0;
        const reworkQty = dto.reworkQty || 0;
        const totalQty = goodQty + scrapQty + reworkQty;
        if (wo.parentWorkOrderId) {
            const availableInput = wo.cumulativeInputQty - wo.cumulativeProcessedQty;
            if (totalQty > availableInput) {
                throw new common_1.BadRequestException(`Total processed (${totalQty}) exceeds available upstream input (${availableInput})`);
            }
        }
        const product = await this.prisma.product.findFirst({ where: { code: wo.productCode, companyId: user.companyId } });
        let productivityRateSnapshot = null;
        let targetQty = null;
        if (product) {
            const productivity = await this.prisma.productStandardProductivity.findFirst({
                where: { companyId: user.companyId, productId: product.id, isActive: true, effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] },
                orderBy: { effectiveFrom: 'desc' },
            });
            if (productivity && productivity.piecesPerManHour > 0) {
                productivityRateSnapshot = productivity.piecesPerManHour;
                targetQty = Math.round(manpowerQty * productivity.piecesPerManHour * durationHours * 100) / 100;
            }
        }
        const achievementPercent = targetQty && targetQty > 0 ? Math.round((goodQty / targetQty) * 10000) / 100 : null;
        const actualLabourHours = Math.round(manpowerQty * durationHours * 10000) / 10000;
        const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
        const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
        let labourRateSnapshot = null;
        let actualLabourCost = null;
        if (rate > 0) {
            labourRateSnapshot = rate / shiftHours;
            actualLabourCost = Math.round(actualLabourHours * labourRateSnapshot * 100) / 100;
        }
        const entryNumber = await this.generateNumber(user.companyId);
        const entry = await this.prisma.productionEntry.create({
            data: {
                entryNumber, workOrderId: dto.workOrderId,
                entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
                shift: dto.shift || 'MORNING',
                operatorName: dto.operatorName, machineName: dto.machineName,
                goodQty, scrapQty, reworkQty, totalQty,
                manpowerQty, periodStart, periodEnd,
                productivityRateSnapshot, labourRateSnapshot,
                targetQty, achievementPercent,
                actualLabourHours, actualLabourCost,
                downtimeMinutes: dto.downtimeMinutes || 0, downtimeReason: dto.downtimeReason,
                remarks: dto.remarks, status: 'DRAFT',
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'production_entries', recordId: entry.id, action: 'CREATE', newValues: entry, changedBy: user.id });
        return entry;
    }
    async confirm(id, user) {
        const entry = await this.prisma.productionEntry.findFirst({
            where: { id, companyId: user.companyId },
            include: { workOrder: true },
        });
        if (!entry)
            throw new common_1.NotFoundException('Production entry not found');
        if (entry.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT entries can be confirmed');
        const newCompletedQty = (entry.workOrder.completedQty || 0) + entry.goodQty;
        const newRejectedQty = (entry.workOrder.rejectedQty || 0) + entry.scrapQty;
        const totalProcessed = entry.goodQty + entry.scrapQty + entry.reworkQty;
        await this.prisma.workOrder.update({
            where: { id: entry.workOrderId },
            data: {
                completedQty: newCompletedQty, rejectedQty: newRejectedQty,
                cumulativeProcessedQty: { increment: totalProcessed },
                updatedBy: user.id,
            },
        });
        const updated = await this.prisma.productionEntry.update({
            where: { id }, data: { status: 'CONFIRMED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'production_entries', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, workOrderId } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [{ entryNumber: { contains: search, mode: 'insensitive' } }];
        if (status)
            where.status = status;
        if (workOrderId)
            where.workOrderId = workOrderId;
        const [data, total] = await Promise.all([
            this.prisma.productionEntry.findMany({
                where, skip, take: Number(limit), orderBy: { entryDate: 'desc' },
                include: this.includes(),
            }),
            this.prisma.productionEntry.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const entry = await this.prisma.productionEntry.findFirst({ where, include: this.includes() });
        if (!entry)
            throw new common_1.NotFoundException('Production entry not found');
        return entry;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, confirmed] = await Promise.all([
            this.prisma.productionEntry.count({ where }),
            this.prisma.productionEntry.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.productionEntry.count({ where: Object.assign(Object.assign({}, where), { status: 'CONFIRMED' }) }),
        ]);
        const totals = await this.prisma.productionEntry.aggregate({
            where: Object.assign(Object.assign({}, where), { status: 'CONFIRMED' }),
            _sum: { goodQty: true, scrapQty: true, totalQty: true, actualLabourCost: true },
        });
        return {
            total, draft, confirmed,
            totalGoodQty: totals._sum.goodQty || 0,
            totalScrapQty: totals._sum.scrapQty || 0,
            totalQty: totals._sum.totalQty || 0,
            totalActualLabourCost: totals._sum.actualLabourCost || 0,
        };
    }
    async getWoProgress(workOrderId, user) {
        const wo = await this.prisma.workOrder.findFirst({
            where: { id: workOrderId, companyId: user.companyId },
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        const entries = await this.prisma.productionEntry.findMany({
            where: { workOrderId, companyId: user.companyId },
            orderBy: { entryDate: 'asc' },
        });
        const confirmedEntries = entries.filter(e => e.status === 'CONFIRMED');
        const confirmedGood = confirmedEntries.reduce((s, e) => s + e.goodQty, 0);
        const confirmedScrap = confirmedEntries.reduce((s, e) => s + e.scrapQty, 0);
        const confirmedRework = confirmedEntries.reduce((s, e) => s + e.reworkQty, 0);
        const totalActualLabourCost = confirmedEntries.reduce((s, e) => s + (e.actualLabourCost || 0), 0);
        const totalActualLabourHours = confirmedEntries.reduce((s, e) => s + (e.actualLabourHours || 0), 0);
        return {
            workOrder: wo,
            entries,
            summary: {
                plannedQty: wo.plannedQty,
                confirmedGoodQty: confirmedGood,
                confirmedScrapQty: confirmedScrap,
                confirmedReworkQty: confirmedRework,
                pendingQty: Math.max(0, wo.plannedQty - confirmedGood),
                completionPercent: wo.plannedQty > 0 ? Math.round(confirmedGood / wo.plannedQty * 100) : 0,
                totalEntries: entries.length,
                totalActualLabourHours,
                totalActualLabourCost,
            },
        };
    }
};
exports.ProductionEntryService = ProductionEntryService;
exports.ProductionEntryService = ProductionEntryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        material_reservation_service_1.MaterialReservationService,
        settings_service_1.SettingsService])
], ProductionEntryService);
//# sourceMappingURL=production-entry.service.js.map