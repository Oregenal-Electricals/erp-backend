import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductionDashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(user: any) {
    const companyId = user.companyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalWos, draftWos, releasedWos, inProgressWos, completedWos, cancelledWos,
      todayEntries, totalFgReceipts, pendingFgr, qcStats, costStats,
    ] = await Promise.all([
      this.prisma.workOrder.count({ where: { companyId } }),
      this.prisma.workOrder.count({ where: { companyId, status: 'DRAFT' } }),
      this.prisma.workOrder.count({ where: { companyId, status: 'RELEASED' } }),
      this.prisma.workOrder.count({ where: { companyId, status: 'IN_PROGRESS' } }),
      this.prisma.workOrder.count({ where: { companyId, status: 'COMPLETED' } }),
      this.prisma.workOrder.count({ where: { companyId, status: 'CANCELLED' } }),
      this.prisma.productionEntry.findMany({
        where: { companyId, status: 'CONFIRMED', entryDate: { gte: today, lt: tomorrow } },
      }),
      this.prisma.fgReceipt.count({ where: { companyId, status: 'RECEIVED' } }),
      this.prisma.workOrder.count({ where: { companyId, status: 'COMPLETED', fgReceipts: { none: { status: 'RECEIVED' } } } }),
      this.prisma.productionQc.aggregate({ where: { companyId }, _sum: { sampleSize: true, passQty: true }, _count: { id: true } }),
      this.prisma.productionCostSheet.aggregate({ where: { companyId }, _sum: { totalCost: true, materialCost: true } }),
    ]);

    const todayGoodQty = todayEntries.reduce((s, e) => s + e.goodQty, 0);
    const todayScrapQty = todayEntries.reduce((s, e) => s + e.scrapQty, 0);
    const overallPassRate = qcStats._sum.sampleSize > 0
      ? Math.round(qcStats._sum.passQty / qcStats._sum.sampleSize * 100) : 0;

    return {
      workOrders: { total: totalWos, draft: draftWos, released: releasedWos, inProgress: inProgressWos, completed: completedWos, cancelled: cancelledWos },
      today: { goodQty: todayGoodQty, scrapQty: todayScrapQty, totalQty: todayGoodQty + todayScrapQty, entries: todayEntries.length },
      fgReceipts: { total: totalFgReceipts, pendingFgr },
      quality: { totalInspections: qcStats._count.id, overallPassRate },
      costs: { totalProductionCost: costStats._sum.totalCost || 0, totalMaterialCost: costStats._sum.materialCost || 0 },
    };
  }

  async getActiveWos(user: any) {
    const companyId = user.companyId;
    const wos = await this.prisma.workOrder.findMany({
      where: { companyId, status: { in: ['RELEASED', 'IN_PROGRESS'] } },
      include: {
        warehouse: { select: { name: true } },
        productionIssues: { where: { status: 'ISSUED' }, select: { id: true } },
      },
      orderBy: [{ priority: 'desc' }, { plannedEndDate: 'asc' }],
      take: 10,
    });

    return wos.map(wo => {
      const progressPct = wo.plannedQty > 0 ? Math.round(wo.completedQty / wo.plannedQty * 100) : 0;
      const isOverdue = wo.plannedEndDate < new Date() && wo.status !== 'COMPLETED';
      const daysLeft = Math.ceil((wo.plannedEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        id: wo.id, woNumber: wo.woNumber, productCode: wo.productCode,
        productName: wo.productName, status: wo.status, priority: wo.priority,
        plannedQty: wo.plannedQty, completedQty: wo.completedQty,
        progressPct, isOverdue, daysLeft,
        warehouse: wo.warehouse?.name,
        materialIssued: wo.productionIssues.length > 0,
        plannedEndDate: wo.plannedEndDate,
      };
    });
  }

  async getToday(user: any) {
    const companyId = user.companyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await this.prisma.productionEntry.findMany({
      where: { companyId, entryDate: { gte: today, lt: tomorrow } },
      include: { workOrder: { select: { woNumber: true, productName: true } } },
      orderBy: { entryDate: 'desc' },
    });

    const byShift = {
      MORNING: entries.filter(e => e.shift === 'MORNING'),
      EVENING: entries.filter(e => e.shift === 'EVENING'),
      NIGHT: entries.filter(e => e.shift === 'NIGHT'),
    };

    return {
      entries,
      byShift: Object.entries(byShift).map(([shift, list]) => ({
        shift,
        entries: list.length,
        goodQty: list.reduce((s, e) => s + e.goodQty, 0),
        scrapQty: list.reduce((s, e) => s + e.scrapQty, 0),
      })),
      totalGoodQty: entries.reduce((s, e) => s + e.goodQty, 0),
      totalScrapQty: entries.reduce((s, e) => s + e.scrapQty, 0),
    };
  }

  async getAlerts(user: any) {
    const companyId = user.companyId;

    // Overdue WOs
    const overdueWos = await this.prisma.workOrder.findMany({
      where: { companyId, status: { in: ['RELEASED','IN_PROGRESS'] }, plannedEndDate: { lt: new Date() } },
      select: { woNumber: true, productName: true, plannedEndDate: true, status: true },
    });

    // WOs with no material issued
    const releasedNoIssue = await this.prisma.workOrder.findMany({
      where: { companyId, status: 'RELEASED', productionIssues: { none: {} } },
      select: { woNumber: true, productName: true, plannedStartDate: true },
    });

    // Failed QC
    const failedQc = await this.prisma.productionQc.findMany({
      where: { companyId, result: 'FAIL' },
      include: { workOrder: { select: { woNumber: true, productName: true } } },
      orderBy: { inspectionDate: 'desc' },
      take: 5,
    });

    // Completed WOs without FGR
    const pendingFgr = await this.prisma.workOrder.findMany({
      where: { companyId, status: 'COMPLETED', fgReceipts: { none: { status: 'RECEIVED' } } },
      select: { woNumber: true, productName: true, completedQty: true },
    });

    return {
      overdueWos, releasedNoIssue, failedQc, pendingFgr,
      totalAlerts: overdueWos.length + releasedNoIssue.length + failedQc.length + pendingFgr.length,
    };
  }

  async getQualityMetrics(user: any) {
    const companyId = user.companyId;
    const inspections = await this.prisma.productionQc.findMany({
      where: { companyId, status: 'COMPLETED' },
      include: { workOrder: { select: { woNumber: true, productName: true } } },
      orderBy: { inspectionDate: 'desc' },
      take: 20,
    });

    const byResult = {
      PASS: inspections.filter(i => i.result === 'PASS').length,
      FAIL: inspections.filter(i => i.result === 'FAIL').length,
      CONDITIONAL: inspections.filter(i => i.result === 'CONDITIONAL').length,
    };

    const totalSampled = inspections.reduce((s, i) => s + i.sampleSize, 0);
    const totalPassed = inspections.reduce((s, i) => s + i.passQty, 0);
    const overallPassRate = totalSampled > 0 ? Math.round(totalPassed / totalSampled * 100) : 0;

    return { inspections, byResult, totalSampled, totalPassed, overallPassRate };
  }
}
