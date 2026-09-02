import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { MaterialReservationService } from '../work-orders/material-reservation.service';
import { SettingsService } from '../settings/settings.service';
import { CreateProductionEntryDto } from './dto/production-entry.dto';

@Injectable()
export class ProductionEntryService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private materialReservation: MaterialReservationService,
    private settings: SettingsService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.productionEntry.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PE-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true, completedQty: true, status: true, stageName: true } },
    };
  }

  // PROD-007: hourly/period stage production entry. Quantity-based
  // manpower throughout (no Employee IDs) - HR tracks who via
  // Attendance/ManpowerAssignment separately. Input-availability,
  // duplicate-period, and pre-start validations are what actually make
  // this safe to consume alongside PROD-006's partial handover.
  async create(dto: CreateProductionEntryDto, user: any) {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: dto.workOrderId, companyId: user.companyId },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (wo.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Work order must be IN_PROGRESS to record production');
    }

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodEnd <= periodStart) throw new BadRequestException('Period end must be after period start');

    const now = new Date();
    if (periodEnd > now) throw new BadRequestException('Cannot record production for a future time period');

    // Entry before production start blocked (spec section 37) - never
    // charge/produce from before the stage actually started.
    if (wo.actualStartDate && periodStart < wo.actualStartDate) {
      throw new BadRequestException(`Entry period cannot start before this stage's actual start time (${wo.actualStartDate.toISOString()})`);
    }

    // Duplicate/overlapping period control (spec section 35) - a
    // double-click or API retry must never double production quantity.
    const overlapping = await this.prisma.productionEntry.findFirst({
      where: {
        workOrderId: dto.workOrderId, companyId: user.companyId, isActive: true,
        periodStart: { lt: periodEnd }, periodEnd: { gt: periodStart },
      },
    });
    if (overlapping) throw new BadRequestException(`This period overlaps with an existing entry (${overlapping.entryNumber})`);

    const durationHours = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);

    // Manpower default (spec section 18): reuse the WO's approved
    // manpower allocation quantity if not explicitly provided, rather
    // than assuming a different number was actually working.
    let manpowerQty = dto.manpowerQty;
    if (manpowerQty === undefined) {
      const approvedAllocation = await this.prisma.manpowerAllocation.findFirst({
        where: { companyId: user.companyId, workOrderId: dto.workOrderId, status: 'APPROVED', isActive: true },
      });
      manpowerQty = approvedAllocation?.count || 0;
    }

    const goodQty = dto.goodQty;
    const scrapQty = dto.scrapQty || 0;
    const reworkQty = dto.reworkQty || 0;
    const totalQty = goodQty + scrapQty + reworkQty;

    // Input-availability control (spec sections 11-12): a downstream
    // stage cannot process more than its available upstream input.
    // The first stage (no parent) draws from Store/material
    // reservation instead - never mix the two sources.
    if (wo.parentWorkOrderId) {
      const availableInput = wo.cumulativeInputQty - wo.cumulativeProcessedQty;
      if (totalQty > availableInput) {
        throw new BadRequestException(`Total processed (${totalQty}) exceeds available upstream input (${availableInput})`);
      }
    }

    // Target/productivity snapshot (spec sections 7-8, 32) - taken now
    // so a later master change never retroactively alters this entry.
    const product = await this.prisma.product.findFirst({ where: { code: wo.productCode, companyId: user.companyId } });
    let productivityRateSnapshot: number | null = null;
    let targetQty: number | null = null;
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

    // Actual labour hours/cost (spec sections 6, 20-22): purely
    // time-based - never reduced merely because output was below
    // target, and never inflated for a partial-hour interval.
    const actualLabourHours = Math.round(manpowerQty * durationHours * 10000) / 10000;
    const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
    const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
    let labourRateSnapshot: number | null = null;
    let actualLabourCost: number | null = null;
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

  // PROD-007 correction (spec section 59): no automatic WO completion.
  // completedQty/rejectedQty/cumulativeProcessedQty accumulate here so
  // downstream availableInput calculations stay correct, but WO status
  // is never flipped - completion needs stage completion, WIP, rework,
  // rejection, QC, handover, and material reconciliation checks that
  // belong to a later, dedicated workflow, not this entry confirmation.
  async confirm(id: string, user: any) {
    const entry = await this.prisma.productionEntry.findFirst({
      where: { id, companyId: user.companyId },
      include: { workOrder: true },
    });
    if (!entry) throw new NotFoundException('Production entry not found');
    if (entry.status !== 'DRAFT') throw new BadRequestException('Only DRAFT entries can be confirmed');

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

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, workOrderId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ entryNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;
    if (workOrderId) where.workOrderId = workOrderId;

    const [data, total] = await Promise.all([
      this.prisma.productionEntry.findMany({
        where, skip, take: Number(limit), orderBy: { entryDate: 'desc' },
        include: this.includes(),
      }),
      this.prisma.productionEntry.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const entry = await this.prisma.productionEntry.findFirst({ where, include: this.includes() });
    if (!entry) throw new NotFoundException('Production entry not found');
    return entry;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, confirmed] = await Promise.all([
      this.prisma.productionEntry.count({ where }),
      this.prisma.productionEntry.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.productionEntry.count({ where: { ...where, status: 'CONFIRMED' } }),
    ]);
    const totals = await this.prisma.productionEntry.aggregate({
      where: { ...where, status: 'CONFIRMED' },
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

  async getWoProgress(workOrderId: string, user: any) {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, companyId: user.companyId },
    });
    if (!wo) throw new NotFoundException('Work order not found');

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
        // Rejection/rework losses never make incurred labour cost
        // disappear (spec section 57) - this is the full stage direct
        // labour cost, not scaled down to only the good pieces.
        totalActualLabourHours,
        totalActualLabourCost,
      },
    };
  }
}
