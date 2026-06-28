import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockReportsService {
  constructor(private prisma: PrismaService) {}

  async getLedger(user: any, query: any) {
    const { warehouseId, itemCode, transactionType, fromDate, toDate, page = 1, limit = 50 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (itemCode) where.itemCode = { contains: itemCode, mode: 'insensitive' };
    if (transactionType) where.transactionType = transactionType;
    if (fromDate || toDate) {
      where.transactionDate = {};
      if (fromDate) where.transactionDate.gte = new Date(fromDate);
      if (toDate) where.transactionDate.lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const [data, total] = await Promise.all([
      this.prisma.stockLedger.findMany({
        where, skip, take: Number(limit),
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        include: { warehouse: { select: { name: true, code: true } } },
      }),
      this.prisma.stockLedger.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getBalanceSummary(user: any, query: any) {
    const { warehouseId, search } = query;
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (search) where.OR = [
      { itemCode: { contains: search, mode: 'insensitive' } },
      { itemName: { contains: search, mode: 'insensitive' } },
    ];

    const balances = await this.prisma.stockBalance.findMany({
      where,
      include: { warehouse: { select: { name: true, code: true } } },
      orderBy: [{ itemCode: 'asc' }],
    });

    // Calculate total value
    const totalValue = balances.reduce((sum, b) => sum + (b.availableQty * b.unitCost), 0);
    const totalItems = balances.length;
    const lowStockItems = balances.filter(b => b.availableQty <= 10).length;

    return { data: balances, totalItems, totalValue, lowStockItems };
  }

  async getItemCard(itemCode: string, user: any, query: any) {
    const { warehouseId, fromDate, toDate } = query;
    const companyId = user.companyId;

    // Get current balance
    const balanceWhere: any = { companyId, itemCode };
    if (warehouseId) balanceWhere.warehouseId = warehouseId;
    const balances = await this.prisma.stockBalance.findMany({
      where: balanceWhere,
      include: { warehouse: { select: { name: true } } },
    });

    // Get all ledger movements
    const ledgerWhere: any = { companyId, itemCode };
    if (warehouseId) ledgerWhere.warehouseId = warehouseId;
    if (fromDate || toDate) {
      ledgerWhere.transactionDate = {};
      if (fromDate) ledgerWhere.transactionDate.gte = new Date(fromDate);
      if (toDate) ledgerWhere.transactionDate.lte = new Date(toDate + 'T23:59:59.999Z');
    }
    const movements = await this.prisma.stockLedger.findMany({
      where: ledgerWhere,
      orderBy: [{ transactionDate: 'asc' }, { createdAt: 'asc' }],
      include: { warehouse: { select: { name: true } } },
    });

    // Get active batches
    const batches = await this.prisma.stockBatch.findMany({
      where: { companyId, itemCode, status: 'ACTIVE' },
      orderBy: { receivedDate: 'asc' },
      include: { warehouse: { select: { name: true } } },
    });

    // Running balance calculation
    let runningQty = 0;
    const ledgerWithBalance = movements.map(m => {
      runningQty += (m.inQty - m.outQty);
      return { ...m, runningBalance: runningQty };
    });

    const totalIn = movements.reduce((s, m) => s + m.inQty, 0);
    const totalOut = movements.reduce((s, m) => s + m.outQty, 0);

    return {
      itemCode, balances, movements: ledgerWithBalance, batches,
      summary: { totalIn, totalOut, netMovement: totalIn - totalOut, currentBalance: balances.reduce((s, b) => s + b.availableQty, 0) },
    };
  }

  async getBatchMovements(user: any, query: any) {
    const { warehouseId, itemCode, status, page = 1, limit = 30 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (itemCode) where.itemCode = { contains: itemCode, mode: 'insensitive' };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.stockBatch.findMany({
        where, skip, take: Number(limit),
        orderBy: [{ receivedDate: 'asc' }],
        include: { warehouse: { select: { name: true } } },
      }),
      this.prisma.stockBatch.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getConsumptionReport(user: any, query: any) {
    const { warehouseId, fromDate, toDate } = query;
    const where: any = { transactionType: 'ISSUE' };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (fromDate || toDate) {
      where.transactionDate = {};
      if (fromDate) where.transactionDate.gte = new Date(fromDate);
      if (toDate) where.transactionDate.lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const movements = await this.prisma.stockLedger.findMany({ where, orderBy: { itemCode: 'asc' } });

    // Group by itemCode
    const grouped: Record<string, any> = {};
    for (const m of movements) {
      if (!grouped[m.itemCode]) {
        grouped[m.itemCode] = { itemCode: m.itemCode, itemName: m.itemName, totalQty: 0, totalValue: 0, transactions: 0 };
      }
      grouped[m.itemCode].totalQty += m.outQty;
      grouped[m.itemCode].totalValue += m.outQty * m.unitCost;
      grouped[m.itemCode].transactions += 1;
    }

    const data = Object.values(grouped).sort((a: any, b: any) => b.totalValue - a.totalValue);
    const totalValue = data.reduce((s: number, d: any) => s + d.totalValue, 0);
    return { data, totalValue, totalItems: data.length };
  }
}
