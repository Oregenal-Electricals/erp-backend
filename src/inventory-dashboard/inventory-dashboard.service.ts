import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryDashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(user: any) {
    const companyId = user.companyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalItems, totalWarehouses, totalBatches,
      pendingGrns, pendingIqc, pendingPutaway,
      todayReceipts, todayIssues, todayTransfers,
      balances,
    ] = await Promise.all([
      this.prisma.stockBalance.count({ where: { companyId, availableQty: { gt: 0 } } }),
      this.prisma.warehouse.count({ where: { companyId, isActive: true } }),
      this.prisma.stockBatch.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.grnHeader.count({ where: { companyId, status: { in: ['DRAFT','SUBMITTED'] } } }),
      this.prisma.iqcInspection.count({ where: { companyId, status: 'PENDING' } }),
      this.prisma.stockPutaway.count({ where: { companyId, status: 'IN_PROGRESS' } }),
      this.prisma.stockLedger.count({ where: { companyId, transactionType: 'IQC_ACCEPT', transactionDate: { gte: today } } }),
      this.prisma.stockLedger.count({ where: { companyId, transactionType: 'ISSUE', transactionDate: { gte: today } } }),
      this.prisma.stockLedger.count({ where: { companyId, transactionType: { in: ['TRANSFER_IN','TRANSFER_OUT'] }, transactionDate: { gte: today } } }),
      this.prisma.stockBalance.findMany({ where: { companyId }, select: { availableQty: true, unitCost: true } }),
    ]);

    const totalStockValue = balances.reduce((s, b) => s + b.availableQty * b.unitCost, 0);

    // Month totals
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const [monthReceipts, monthIssues] = await Promise.all([
      this.prisma.stockLedger.aggregate({ where: { companyId, transactionType: 'IQC_ACCEPT', transactionDate: { gte: monthStart } }, _sum: { inQty: true } }),
      this.prisma.stockLedger.aggregate({ where: { companyId, transactionType: 'ISSUE', transactionDate: { gte: monthStart } }, _sum: { outQty: true } }),
    ]);

    return {
      totalItems, totalWarehouses, totalBatches, totalStockValue,
      pendingGrns, pendingIqc, pendingPutaway,
      today: { receipts: todayReceipts, issues: todayIssues, transfers: Math.floor(todayTransfers / 2) },
      month: { receipts: monthReceipts._sum.inQty || 0, issues: monthIssues._sum.outQty || 0 },
    };
  }

  async getAlerts(user: any) {
    const companyId = user.companyId;
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [lowStock, expiringBatches, expiredBatches, pendingGrns, pendingIqc, quarantinedBatches] = await Promise.all([
      this.prisma.stockBalance.findMany({
        where: { companyId, availableQty: { gt: 0, lte: 10 } },
        select: { itemCode: true, itemName: true, availableQty: true },
        orderBy: { availableQty: 'asc' }, take: 10,
      }),
      this.prisma.stockBatch.findMany({
        where: { companyId, status: 'ACTIVE', expiryDate: { lte: in30Days, gte: now } },
        select: { batchNumber: true, itemCode: true, itemName: true, expiryDate: true, availableQty: true },
        orderBy: { expiryDate: 'asc' }, take: 10,
      }),
      this.prisma.stockBatch.count({ where: { companyId, status: 'EXPIRED' } }),
      this.prisma.grnHeader.findMany({
        where: { companyId, status: { in: ['DRAFT','SUBMITTED'] } },
        select: { grnNumber: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' }, take: 5,
      }),
      this.prisma.iqcInspection.findMany({
        where: { companyId, status: 'PENDING' },
        select: { iqcNumber: true, createdAt: true },
        orderBy: { createdAt: 'desc' }, take: 5,
      }),
      this.prisma.stockBatch.count({ where: { companyId, status: 'QUARANTINED' } }),
    ]);

    return { lowStock, expiringBatches, expiredBatches, pendingGrns, pendingIqc, quarantinedBatches };
  }

  async getActivity(user: any) {
    const companyId = user.companyId;
    const movements = await this.prisma.stockLedger.findMany({
      where: { companyId },
      orderBy: { transactionDate: 'desc' },
      take: 15,
      include: { warehouse: { select: { name: true } } },
    });
    return movements;
  }

  async getTopItems(user: any) {
    const companyId = user.companyId;
    const balances = await this.prisma.stockBalance.findMany({
      where: { companyId, availableQty: { gt: 0 } },
      include: { warehouse: { select: { name: true } } },
    });

    // Sort by stock value
    const sorted = balances
      .map(b => ({ ...b, stockValue: b.availableQty * b.unitCost }))
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 10);

    const totalValue = sorted.reduce((s, b) => s + b.stockValue, 0);
    return { data: sorted, totalValue };
  }
}
