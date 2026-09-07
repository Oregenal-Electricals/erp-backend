import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductionReportsService {
  constructor(private prisma: PrismaService) {}

  private dateWhere(fromDate?: string, toDate?: string) {
    if (!fromDate && !toDate) return undefined;
    const obj: any = {};
    if (fromDate) obj.gte = new Date(fromDate);
    if (toDate) obj.lte = new Date(toDate + 'T23:59:59.999Z');
    return obj;
  }

  async getWoCompletionReport(user: any, query: any) {
    const { fromDate, toDate, status } = query;
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    const dateWhere = this.dateWhere(fromDate, toDate);
    if (dateWhere) where.createdAt = dateWhere;

    const wos = await this.prisma.workOrder.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { warehouse: { select: { name: true } }, costSheet: { select: { totalCost: true, unitCost: true } } },
    });

    const data = wos.map(wo => ({
      woNumber: wo.woNumber, productCode: wo.productCode, productName: wo.productName,
      status: wo.status, priority: wo.priority, warehouse: wo.warehouse?.name,
      plannedQty: wo.plannedQty, completedQty: wo.completedQty, rejectedQty: wo.rejectedQty,
      achievementPct: wo.plannedQty > 0 ? Math.round(wo.completedQty / wo.plannedQty * 100) : 0,
      plannedStartDate: wo.plannedStartDate, plannedEndDate: wo.plannedEndDate,
      actualStartDate: wo.actualStartDate, actualEndDate: wo.actualEndDate,
      totalCost: wo.costSheet?.totalCost || 0, unitCost: wo.costSheet?.unitCost || 0,
    }));

    return {
      data, totalWos: data.length,
      avgAchievement: data.length > 0 ? Math.round(data.reduce((s,d)=>s+d.achievementPct,0)/data.length) : 0,
      totalPlanned: data.reduce((s,d)=>s+d.plannedQty,0),
      totalCompleted: data.reduce((s,d)=>s+d.completedQty,0),
    };
  }

  async getShiftProductionReport(user: any, query: any) {
    const { fromDate, toDate, shift } = query;
    const where: any = { companyId: user.companyId, status: 'CONFIRMED' };
    if (shift) where.shift = shift;
    const dateWhere = this.dateWhere(fromDate, toDate);
    if (dateWhere) where.entryDate = dateWhere;

    const entries = await this.prisma.productionEntry.findMany({
      where, orderBy: { entryDate: 'desc' },
      include: { workOrder: { select: { woNumber: true, productName: true } } },
    });

    const byShift: Record<string, any> = {};
    for (const e of entries) {
      if (!byShift[e.shift]) byShift[e.shift] = { shift: e.shift, entries: 0, goodQty: 0, scrapQty: 0 };
      byShift[e.shift].entries++;
      byShift[e.shift].goodQty += e.goodQty;
      byShift[e.shift].scrapQty += e.scrapQty;
    }

    const byOperator: Record<string, any> = {};
    for (const e of entries) {
      const key = e.operatorName || 'Unassigned';
      if (!byOperator[key]) byOperator[key] = { operator: key, entries: 0, goodQty: 0, scrapQty: 0 };
      byOperator[key].entries++;
      byOperator[key].goodQty += e.goodQty;
      byOperator[key].scrapQty += e.scrapQty;
    }

    return {
      data: entries, totalEntries: entries.length,
      byShift: Object.values(byShift), byOperator: Object.values(byOperator),
      totalGoodQty: entries.reduce((s,e)=>s+e.goodQty,0),
      totalScrapQty: entries.reduce((s,e)=>s+e.scrapQty,0),
    };
  }

  async getMaterialConsumptionReport(user: any, query: any) {
    const { workOrderId } = query;
    const where: any = { companyId: user.companyId, status: 'ISSUED' };
    if (workOrderId) where.workOrderId = workOrderId;

    const issues = await this.prisma.productionIssue.findMany({
      where, include: {
        workOrder: { select: { woNumber: true, productName: true, plannedQty: true, bomId: true } },
        items: true,
      },
    });

    const consumption: Record<string, any> = {};
    for (const issue of issues) {
      for (const item of issue.items) {
        const key = item.itemCode;
        if (!consumption[key]) {
          consumption[key] = { itemCode: item.itemCode, itemName: item.itemName, uom: item.uom, totalIssued: 0, totalValue: 0, woCount: 0 };
        }
        consumption[key].totalIssued += item.issuedQty;
        consumption[key].totalValue += item.issuedQty * item.unitCost;
        consumption[key].woCount++;
      }
    }

    const data = Object.values(consumption).sort((a: any, b: any) => b.totalValue - a.totalValue);
    return { data, totalItems: data.length, totalValue: data.reduce((s: number, d: any) => s + d.totalValue, 0) };
  }

  async getScrapAnalysis(user: any, query: any) {
    const { fromDate, toDate } = query;
    const where: any = { companyId: user.companyId, status: 'CONFIRMED', scrapQty: { gt: 0 } };
    const dateWhere = this.dateWhere(fromDate, toDate);
    if (dateWhere) where.entryDate = dateWhere;

    const entries = await this.prisma.productionEntry.findMany({
      where, orderBy: { scrapQty: 'desc' },
      include: { workOrder: { select: { woNumber: true, productCode: true, productName: true } } },
    });

    const byProduct: Record<string, any> = {};
    for (const e of entries) {
      const key = e.workOrder.productCode;
      if (!byProduct[key]) byProduct[key] = { productCode: key, productName: e.workOrder.productName, totalScrap: 0, totalGood: 0, entries: 0 };
      byProduct[key].totalScrap += e.scrapQty;
      byProduct[key].totalGood += e.goodQty;
      byProduct[key].entries++;
    }

    const byProductArr = Object.values(byProduct).map((p: any) => ({
      ...p, scrapRate: (p.totalGood + p.totalScrap) > 0 ? Math.round(p.totalScrap / (p.totalGood + p.totalScrap) * 100 * 10) / 10 : 0,
    }));

    const totalScrap = entries.reduce((s,e)=>s+e.scrapQty,0);
    const totalGood = entries.reduce((s,e)=>s+e.goodQty,0);

    return {
      data: entries, byProduct: byProductArr,
      totalScrap, totalGood,
      overallScrapRate: (totalGood+totalScrap)>0 ? Math.round(totalScrap/(totalGood+totalScrap)*100*10)/10 : 0,
    };
  }

  async getQualitySummary(user: any, query: any) {
    const { fromDate, toDate, stage } = query;
    const where: any = { companyId: user.companyId, status: 'COMPLETED' };
    if (stage) where.inspectionStage = stage;
    const dateWhere = this.dateWhere(fromDate, toDate);
    if (dateWhere) where.inspectionDate = dateWhere;

    const inspections = await this.prisma.productionQc.findMany({
      where, orderBy: { inspectionDate: 'desc' },
      include: { workOrder: { select: { woNumber: true, productCode: true, productName: true } } },
    });

    const byStage: Record<string, any> = {};
    for (const i of inspections) {
      if (!byStage[i.inspectionStage]) byStage[i.inspectionStage] = { stage: i.inspectionStage, total: 0, pass: 0, fail: 0, conditional: 0, sampleSize: 0, passQty: 0 };
      byStage[i.inspectionStage].total++;
      byStage[i.inspectionStage].sampleSize += i.sampleSize;
      byStage[i.inspectionStage].passQty += i.passQty;
      if (i.result === 'PASS') byStage[i.inspectionStage].pass++;
      else if (i.result === 'FAIL') byStage[i.inspectionStage].fail++;
      else if (i.result === 'CONDITIONAL') byStage[i.inspectionStage].conditional++;
    }

    const byStageArr = Object.values(byStage).map((s: any) => ({
      ...s, passRate: s.sampleSize > 0 ? Math.round(s.passQty / s.sampleSize * 100) : 0,
    }));

    const totalSampled = inspections.reduce((s,i)=>s+i.sampleSize,0);
    const totalPassed = inspections.reduce((s,i)=>s+i.passQty,0);

    return {
      data: inspections, byStage: byStageArr, totalInspections: inspections.length,
      overallPassRate: totalSampled > 0 ? Math.round(totalPassed/totalSampled*100) : 0,
    };
  }

  // Extends the existing production-reports module (not a new module -
  // reused per project convention) with time-bucketed, product-wise
  // output the prior 5 reports never provided: WO Completion is a flat
  // per-WO list, Shift Production groups only by shift/operator, and
  // neither buckets by calendar day or groups by product. This fills
  // that gap using the same source (ProductionEntry, CONFIRMED only)
  // and the same date-range filtering pattern as the other reports.
  //
  // Grouping is done in application code rather than a SQL date_trunc
  // groupBy, matching getShiftProductionReport()'s existing approach -
  // entries are fetched once, then bucketed by day and by product in
  // memory, so the response supports both a daily trend view and a
  // product-wise breakdown from a single query.
  // Truncates an ISO timestamp to the requested bucket width. HOUR and
  // MONTH are Phase 2 additions - same slice-based approach as the
  // original DAY bucketing, just a different ISO prefix length, so no
  // new query/grouping logic was needed to add them.
  private truncateToKey(iso: string, granularity: string): string {
    if (granularity === 'HOUR') return iso.slice(0, 13);   // YYYY-MM-DDTHH
    if (granularity === 'MONTH') return iso.slice(0, 7);   // YYYY-MM
    return iso.slice(0, 10);                                // YYYY-MM-DD (DAY, default)
  }

  // Phase 1 built this as day-only; Phase 2 generalizes it to also
  // support HOUR and MONTH granularity via the same query and the same
  // in-memory bucketing approach - only the truncation width changes.
  // The daily-output endpoint/frontend tab keep working unchanged
  // (granularity defaults to DAY), so this is additive, not a breaking
  // change to the existing report.
  async getDailyOutputByProduct(user: any, query: any) {
    const { fromDate, toDate, productCode, granularity = 'DAY' } = query;
    const gran = ['HOUR', 'DAY', 'MONTH'].includes(granularity) ? granularity : 'DAY';
    const where: any = { companyId: user.companyId, status: 'CONFIRMED' };
    const dateWhere = this.dateWhere(fromDate, toDate);
    if (dateWhere) where.entryDate = dateWhere;
    if (productCode) where.workOrder = { productCode };

    const entries = await this.prisma.productionEntry.findMany({
      where, orderBy: { entryDate: 'asc' },
      include: { workOrder: { select: { woNumber: true, productCode: true, productName: true, stageName: true } } },
    });

    const byDate: Record<string, any> = {};
    const byProduct: Record<string, any> = {};

    for (const e of entries) {
      const dateKey = this.truncateToKey(e.entryDate.toISOString(), gran);
      const prodCode = e.workOrder?.productCode || 'UNKNOWN';
      const prodName = e.workOrder?.productName || 'Unknown';

      if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey, goodQty: 0, scrapQty: 0, reworkQty: 0, entries: 0 };
      byDate[dateKey].goodQty += e.goodQty;
      byDate[dateKey].scrapQty += e.scrapQty;
      byDate[dateKey].reworkQty += e.reworkQty;
      byDate[dateKey].entries++;

      const prodKey = prodCode;
      if (!byProduct[prodKey]) byProduct[prodKey] = { productCode: prodCode, productName: prodName, goodQty: 0, scrapQty: 0, reworkQty: 0, entries: 0 };
      byProduct[prodKey].goodQty += e.goodQty;
      byProduct[prodKey].scrapQty += e.scrapQty;
      byProduct[prodKey].reworkQty += e.reworkQty;
      byProduct[prodKey].entries++;
    }

    return {
      granularity: gran,
      byDate: Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      byProduct: Object.values(byProduct).sort((a: any, b: any) => b.goodQty - a.goodQty),
      totalGoodQty: entries.reduce((s, e) => s + e.goodQty, 0),
      totalScrapQty: entries.reduce((s, e) => s + e.scrapQty, 0),
      totalReworkQty: entries.reduce((s, e) => s + e.reworkQty, 0),
      totalEntries: entries.length,
    };
  }

  // Phase 3: OEE = Availability x Performance x Quality, computed
  // entirely from ProductionEntry (periodStart/periodEnd/downtimeMinutes
  // for Availability, targetQty/totalQty for Performance, goodQty/
  // totalQty for Quality) - periodStart/periodEnd are mandatory,
  // validated fields on every entry (see ProductionEntryService), so
  // no separate Downtime/ManpowerAllocation join was needed.
  //
  // Per-bucket ratios are computed from summed underlying quantities
  // (total duration, total downtime, total output, total target)
  // rather than averaging each entry's individual ratio - averaging
  // ratios directly would misweight short entries the same as long
  // ones and produce a misleading bucket-level number.
  //
  // Entries missing targetQty get performance/oee left null for that
  // entry, but their duration/downtime/quality inputs still count
  // toward the bucket sums - only the targetQty-dependent piece is
  // withheld, not the whole entry.
  async getOeeReport(user: any, query: any) {
    const { fromDate, toDate, productCode, granularity = 'DAY' } = query;
    const gran = ['HOUR', 'DAY', 'MONTH'].includes(granularity) ? granularity : 'DAY';
    const where: any = { companyId: user.companyId, status: 'CONFIRMED' };
    const dateWhere = this.dateWhere(fromDate, toDate);
    if (dateWhere) where.entryDate = dateWhere;
    if (productCode) where.workOrder = { productCode };

    const entries = await this.prisma.productionEntry.findMany({
      where, orderBy: { entryDate: 'asc' },
      include: { workOrder: { select: { woNumber: true, productCode: true, productName: true, stageName: true } } },
    });

    const ratio = (num: number, den: number) => (den > 0 ? num / den : null);
    const computeOee = (durationMin: number, downtimeMin: number, totalQty: number, targetQty: number, goodQty: number) => {
      const availability = ratio(Math.max(durationMin - downtimeMin, 0), durationMin);
      const performance = targetQty > 0 ? ratio(totalQty, targetQty) : null;
      const quality = ratio(goodQty, totalQty);
      const oee = availability != null && performance != null && quality != null ? availability * performance * quality : null;
      return { availability, performance, quality, oee };
    };

    const byBucket: Record<string, any> = {};
    const byProduct: Record<string, any> = {};

    let grandDuration = 0, grandDowntime = 0, grandTotalQty = 0, grandTargetQty = 0, grandGoodQty = 0;

    for (const e of entries) {
      const durationMin = e.periodStart && e.periodEnd
        ? (new Date(e.periodEnd).getTime() - new Date(e.periodStart).getTime()) / 60000
        : 0;
      const downtimeMin = e.downtimeMinutes || 0;
      const targetQty = e.targetQty || 0;

      const bucketKey = this.truncateToKey(e.entryDate.toISOString(), gran);
      if (!byBucket[bucketKey]) byBucket[bucketKey] = { date: bucketKey, durationMin: 0, downtimeMin: 0, totalQty: 0, targetQty: 0, goodQty: 0, entries: 0 };
      byBucket[bucketKey].durationMin += durationMin;
      byBucket[bucketKey].downtimeMin += downtimeMin;
      byBucket[bucketKey].totalQty += e.totalQty;
      byBucket[bucketKey].targetQty += targetQty;
      byBucket[bucketKey].goodQty += e.goodQty;
      byBucket[bucketKey].entries++;

      const prodCode = e.workOrder?.productCode || 'UNKNOWN';
      const prodName = e.workOrder?.productName || 'Unknown';
      if (!byProduct[prodCode]) byProduct[prodCode] = { productCode: prodCode, productName: prodName, durationMin: 0, downtimeMin: 0, totalQty: 0, targetQty: 0, goodQty: 0, entries: 0 };
      byProduct[prodCode].durationMin += durationMin;
      byProduct[prodCode].downtimeMin += downtimeMin;
      byProduct[prodCode].totalQty += e.totalQty;
      byProduct[prodCode].targetQty += targetQty;
      byProduct[prodCode].goodQty += e.goodQty;
      byProduct[prodCode].entries++;

      grandDuration += durationMin; grandDowntime += downtimeMin;
      grandTotalQty += e.totalQty; grandTargetQty += targetQty; grandGoodQty += e.goodQty;
    }

    const finalizeBucket = (b: any) => ({ ...b, ...computeOee(b.durationMin, b.downtimeMin, b.totalQty, b.targetQty, b.goodQty) });

    return {
      granularity: gran,
      byDate: Object.values(byBucket).map(finalizeBucket).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      byProduct: Object.values(byProduct).map(finalizeBucket).sort((a: any, b: any) => (b.oee || 0) - (a.oee || 0)),
      overall: computeOee(grandDuration, grandDowntime, grandTotalQty, grandTargetQty, grandGoodQty),
      totalEntries: entries.length,
    };
  }

  // Phase 4: cost trend, bucketed the same way as Phase 1-3 but
  // sourced from ProductionCostSheet rather than ProductionEntry -
  // only FINALIZED cost sheets are included (mirrors the CONFIRMED-
  // only rule for entries: a still-open WO's cost sheet can still
  // change, so including it would make the trend retroactively shift
  // under the user).
  //
  // ProductionCostSheet has no date field of its own - it's bucketed
  // by WorkOrder.closedAt, the moment the cost was actually finalized
  // (PROD-018), not by when the cost sheet row happened to be created/
  // updated in the database.
  //
  // avgUnitCost is netActualCost/finalGoodFgQty computed on the
  // aggregated sums per bucket, not an average of each WO's individual
  // unitCost - same aggregate-then-ratio principle as OEE, since
  // averaging per-WO unit costs directly would misweight a 10-unit WO
  // the same as a 10,000-unit one.
  async getCostTrend(user: any, query: any) {
    const { fromDate, toDate, productCode, granularity = 'DAY' } = query;
    const gran = ['HOUR', 'DAY', 'MONTH'].includes(granularity) ? granularity : 'DAY';
    const workOrderWhere: any = {};
    const dateWhere = this.dateWhere(fromDate, toDate);
    if (dateWhere) workOrderWhere.closedAt = dateWhere;
    if (productCode) workOrderWhere.productCode = productCode;

    const sheets = await this.prisma.productionCostSheet.findMany({
      where: { companyId: user.companyId, status: 'FINALIZED', workOrder: workOrderWhere },
      include: { workOrder: { select: { woNumber: true, productCode: true, productName: true, closedAt: true } } },
    });

    const ratio = (num: number, den: number) => (den > 0 ? num / den : null);

    const byBucket: Record<string, any> = {};
    const byProduct: Record<string, any> = {};
    let grandMaterial = 0, grandLabor = 0, grandOverhead = 0, grandOther = 0, grandNetActual = 0, grandFgQty = 0;

    for (const s of sheets) {
      // Cost sheets can only be FINALIZED after WorkOrder.closeWorkOrder()
      // sets closedAt, so this is never null for a sheet that reaches
      // this filter - but skip defensively rather than crash on a
      // future data inconsistency.
      if (!s.workOrder?.closedAt) continue;

      const bucketKey = this.truncateToKey(new Date(s.workOrder.closedAt).toISOString(), gran);
      if (!byBucket[bucketKey]) byBucket[bucketKey] = { date: bucketKey, materialCost: 0, laborCost: 0, overheadCost: 0, otherCost: 0, netActualCost: 0, finalGoodFgQty: 0, woCount: 0 };
      byBucket[bucketKey].materialCost += s.materialCost;
      byBucket[bucketKey].laborCost += s.laborCost;
      byBucket[bucketKey].overheadCost += s.overheadCost;
      byBucket[bucketKey].otherCost += s.otherCost;
      byBucket[bucketKey].netActualCost += s.netActualCost;
      byBucket[bucketKey].finalGoodFgQty += s.finalGoodFgQty;
      byBucket[bucketKey].woCount++;

      const prodCode = s.workOrder.productCode || 'UNKNOWN';
      const prodName = s.workOrder.productName || 'Unknown';
      if (!byProduct[prodCode]) byProduct[prodCode] = { productCode: prodCode, productName: prodName, materialCost: 0, laborCost: 0, overheadCost: 0, otherCost: 0, netActualCost: 0, finalGoodFgQty: 0, woCount: 0 };
      byProduct[prodCode].materialCost += s.materialCost;
      byProduct[prodCode].laborCost += s.laborCost;
      byProduct[prodCode].overheadCost += s.overheadCost;
      byProduct[prodCode].otherCost += s.otherCost;
      byProduct[prodCode].netActualCost += s.netActualCost;
      byProduct[prodCode].finalGoodFgQty += s.finalGoodFgQty;
      byProduct[prodCode].woCount++;

      grandMaterial += s.materialCost; grandLabor += s.laborCost; grandOverhead += s.overheadCost; grandOther += s.otherCost;
      grandNetActual += s.netActualCost; grandFgQty += s.finalGoodFgQty;
    }

    const finalize = (b: any) => ({ ...b, avgUnitCost: ratio(b.netActualCost, b.finalGoodFgQty) });

    return {
      granularity: gran,
      byDate: Object.values(byBucket).map(finalize).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      byProduct: Object.values(byProduct).map(finalize).sort((a: any, b: any) => b.netActualCost - a.netActualCost),
      totals: {
        materialCost: grandMaterial, laborCost: grandLabor, overheadCost: grandOverhead, otherCost: grandOther,
        netActualCost: grandNetActual, finalGoodFgQty: grandFgQty,
        avgUnitCost: ratio(grandNetActual, grandFgQty),
      },
      totalWos: sheets.length,
    };
  }
}
