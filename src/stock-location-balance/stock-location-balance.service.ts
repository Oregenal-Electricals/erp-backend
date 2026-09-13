import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// STORE-015: the single place that ever writes to StockLocationBalance.
// Every caller (put-away, issue, return, transfer) goes through
// adjustQty() so the same optimistic-concurrency retry protects every
// writer, and no caller can drift from another's idea of how a row
// gets created vs incremented vs zeroed out.
@Injectable()
export class StockLocationBalanceService {
  constructor(private prisma: PrismaService) {}

  // Increments (positive deltaQty) or decrements (negative deltaQty)
  // the balance for one exact (item, bin, batch, status) combination.
  // Creates the row on first use. Never allows the result to go
  // negative - a decrement larger than what's actually there is a
  // caller bug (stale read) and must fail loud, not silently floor at 0.
  async adjustQty(params: {
    companyId: string; itemCode: string; itemName: string;
    warehouseId: string; binId: string; batchId?: string | null; status?: string;
    deltaQty: number; userId: string;
  }): Promise<number> {
    const { companyId, itemCode, itemName, warehouseId, binId, userId } = params;
    const batchId = params.batchId ?? null;
    const status = params.status || 'AVAILABLE';
    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const existing = await this.prisma.stockLocationBalance.findFirst({
        where: { companyId, itemCode, binId, batchId, status },
      });

      if (!existing) {
        if (params.deltaQty < 0) {
          throw new BadRequestException(`No stock of ${itemCode} found in this bin to move/decrement.`);
        }
        try {
          const created = await this.prisma.stockLocationBalance.create({
            data: {
              companyId, itemCode, itemName, warehouseId, binId, batchId, status,
              qty: params.deltaQty, createdBy: userId, updatedBy: userId,
            },
          });
          return created.qty;
        } catch (e) {
          // Concurrent create for the same unique key - another request
          // won the race, retry as an update against the now-existing row.
          continue;
        }
      }

      const newQty = existing.qty + params.deltaQty;
      if (newQty < -0.0001) {
        throw new BadRequestException(`Cannot reduce ${itemCode} in this bin below zero (has ${existing.qty}, requested change ${params.deltaQty}).`);
      }

      const result = await this.prisma.stockLocationBalance.updateMany({
        where: { id: existing.id, qty: existing.qty },
        data: { qty: Math.max(0, newQty), updatedBy: userId },
      });
      if (result.count === 1) return Math.max(0, newQty);
      // Someone else updated this exact row in between - retry with a fresh read.
    }
    throw new BadRequestException('Could not update the bin balance - too many concurrent updates, please retry.');
  }

  // Best-effort decrement across whichever bin(s) currently hold this
  // item/batch, oldest bin-row first, used by STORE-012 issue where the
  // issue flow itself never picks a specific bin (StockBalance/
  // StockBatch remain the authoritative source of truth for whether the
  // issue itself is valid - this just keeps the location view honest
  // where it can). Never throws if the location view can't fully cover
  // the qty (e.g. a batch predating the backfill, or a non-batch-
  // tracked item) - returns however much it actually found and
  // deducted, and the caller is expected to treat this as best-effort.
  async consumeAcrossBins(companyId: string, itemCode: string, batchId: string | null, qtyNeeded: number, userId: string, status = 'AVAILABLE'): Promise<number> {
    if (qtyNeeded <= 0) return 0;
    const rows = await this.prisma.stockLocationBalance.findMany({
      where: { companyId, itemCode, batchId, status, qty: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    });
    let remaining = qtyNeeded;
    let consumed = 0;
    for (const row of rows) {
      if (remaining <= 0.0001) break;
      const take = Math.min(row.qty, remaining);
      await this.adjustQty({
        companyId, itemCode, itemName: row.itemName, warehouseId: row.warehouseId,
        binId: row.binId, batchId: row.batchId, status, deltaQty: -take, userId,
      });
      remaining -= take;
      consumed += take;
    }
    return consumed;
  }

  async getBalance(companyId: string, itemCode: string, binId: string, batchId: string | null, status = 'AVAILABLE') {
    return this.prisma.stockLocationBalance.findFirst({ where: { companyId, itemCode, binId, batchId, status } });
  }

  // STORE-015 section 50: "open a bin, see everything in it."
  async getByBin(companyId: string, binId: string) {
    return this.prisma.stockLocationBalance.findMany({
      where: { companyId, binId, qty: { gt: 0 } },
      include: { batch: { select: { batchNumber: true, expiryDate: true } } },
      orderBy: { itemCode: 'asc' },
    });
  }

  // STORE-015 section 49: "search a material, see all its current bins."
  async getByItem(companyId: string, itemCode: string) {
    return this.prisma.stockLocationBalance.findMany({
      where: { companyId, itemCode, qty: { gt: 0 } },
      include: { bin: { select: { code: true, rackId: true } }, batch: { select: { batchNumber: true } } },
      orderBy: [{ warehouseId: 'asc' }, { status: 'asc' }],
    });
  }
}
