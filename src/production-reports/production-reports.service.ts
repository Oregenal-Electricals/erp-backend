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
}
