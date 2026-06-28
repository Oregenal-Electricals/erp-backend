import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryValuationService {
  constructor(private prisma: PrismaService) {}

  async getSummary(user: any, query: any) {
    const { warehouseId } = query;
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (warehouseId) where.warehouseId = warehouseId;

    const balances = await this.prisma.stockBalance.findMany({
      where,
      include: { warehouse: { select: { name: true, code: true } } },
    });

    // Group by warehouse
    const byWarehouse: Record<string, any> = {};
    let grandTotal = 0;
    let totalItems = 0;
    let zeroStockItems = 0;

    for (const b of balances) {
      const wName = b.warehouse?.name || 'Unknown';
      if (!byWarehouse[wName]) byWarehouse[wName] = { warehouse: wName, items: 0, totalQty: 0, totalValue: 0 };
      const value = b.availableQty * b.unitCost;
      byWarehouse[wName].items += 1;
      byWarehouse[wName].totalQty += b.availableQty;
      byWarehouse[wName].totalValue += value;
      grandTotal += value;
      totalItems += 1;
      if (b.availableQty === 0) zeroStockItems += 1;
    }

    return {
      grandTotal,
      totalItems,
      zeroStockItems,
      activeItems: totalItems - zeroStockItems,
      byWarehouse: Object.values(byWarehouse).sort((a: any, b: any) => b.totalValue - a.totalValue),
    };
  }

  async getAging(user: any, query: any) {
    const { warehouseId } = query;
    const companyId = user.companyId;
    const now = new Date();

    const balances = await this.prisma.stockBalance.findMany({
      where: { companyId, ...(warehouseId ? { warehouseId } : {}), availableQty: { gt: 0 } },
      include: { warehouse: { select: { name: true } } },
    });

    const result = [];
    for (const b of balances) {
      // Get last movement date for this item+warehouse
      const lastMovement = await this.prisma.stockLedger.findFirst({
        where: { companyId, itemCode: b.itemCode, warehouseId: b.warehouseId },
        orderBy: { transactionDate: 'desc' },
        select: { transactionDate: true, transactionType: true },
      });

      const lastDate = lastMovement?.transactionDate || b.createdAt;
      const daysSinceMovement = Math.floor((now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
      let agingBucket = '0-30 days';
      if (daysSinceMovement > 180) agingBucket = '180+ days (Dead Stock)';
      else if (daysSinceMovement > 90) agingBucket = '91-180 days';
      else if (daysSinceMovement > 60) agingBucket = '61-90 days';
      else if (daysSinceMovement > 30) agingBucket = '31-60 days';

      result.push({
        itemCode: b.itemCode, itemName: b.itemName, warehouse: b.warehouse?.name,
        availableQty: b.availableQty, unitCost: b.unitCost,
        stockValue: b.availableQty * b.unitCost,
        lastMovementDate: lastDate, daysSinceMovement, agingBucket,
        lastMovementType: lastMovement?.transactionType,
      });
    }

    // Group by bucket
    const buckets: Record<string, any> = {};
    for (const r of result) {
      if (!buckets[r.agingBucket]) buckets[r.agingBucket] = { bucket: r.agingBucket, items: 0, totalValue: 0, records: [] };
      buckets[r.agingBucket].items += 1;
      buckets[r.agingBucket].totalValue += r.stockValue;
      buckets[r.agingBucket].records.push(r);
    }

    const bucketOrder = ['0-30 days','31-60 days','61-90 days','91-180 days','180+ days (Dead Stock)'];
    return {
      data: result.sort((a, b) => b.daysSinceMovement - a.daysSinceMovement),
      buckets: bucketOrder.map(b => buckets[b] || { bucket: b, items: 0, totalValue: 0, records: [] }),
      totalValue: result.reduce((s, r) => s + r.stockValue, 0),
    };
  }

  async getSlowMoving(user: any, query: any) {
    const { warehouseId, days = 30 } = query;
    const companyId = user.companyId;
    const cutoffDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const balances = await this.prisma.stockBalance.findMany({
      where: { companyId, ...(warehouseId ? { warehouseId } : {}), availableQty: { gt: 0 } },
      include: { warehouse: { select: { name: true } } },
    });

    const slowMoving = [];
    for (const b of balances) {
      const recentMovement = await this.prisma.stockLedger.findFirst({
        where: { companyId, itemCode: b.itemCode, warehouseId: b.warehouseId, transactionDate: { gte: cutoffDate } },
      });
      if (!recentMovement) {
        slowMoving.push({
          itemCode: b.itemCode, itemName: b.itemName, warehouse: b.warehouse?.name,
          availableQty: b.availableQty, unitCost: b.unitCost,
          stockValue: b.availableQty * b.unitCost,
        });
      }
    }

    const totalValue = slowMoving.reduce((s, r) => s + r.stockValue, 0);
    return { data: slowMoving.sort((a, b) => b.stockValue - a.stockValue), totalItems: slowMoving.length, totalValue, days: Number(days) };
  }

  async getFifoValue(user: any, query: any) {
    const { warehouseId } = query;
    const companyId = user.companyId;
    const where: any = { companyId, status: 'ACTIVE', availableQty: { gt: 0 } };
    if (warehouseId) where.warehouseId = warehouseId;

    const batches = await this.prisma.stockBatch.findMany({
      where,
      include: { warehouse: { select: { name: true } } },
      orderBy: [{ itemCode: 'asc' }, { receivedDate: 'asc' }],
    });

    // Group by item
    const grouped: Record<string, any> = {};
    for (const b of batches) {
      const key = `${b.itemCode}|${b.warehouseId}`;
      if (!grouped[key]) {
        grouped[key] = { itemCode: b.itemCode, itemName: b.itemName, warehouse: b.warehouse?.name, totalQty: 0, fifoValue: 0, avgCost: 0, batches: [] };
      }
      grouped[key].totalQty += b.availableQty;
      grouped[key].fifoValue += b.availableQty * b.unitCost;
      grouped[key].batches.push({ batchNumber: b.batchNumber, qty: b.availableQty, unitCost: b.unitCost, receivedDate: b.receivedDate });
    }

    const data = Object.values(grouped).map((g: any) => ({ ...g, avgCost: g.totalQty > 0 ? g.fifoValue / g.totalQty : 0 }));
    const totalFifoValue = data.reduce((s: number, d: any) => s + d.fifoValue, 0);
    return { data, totalFifoValue, totalItems: data.length };
  }
}
