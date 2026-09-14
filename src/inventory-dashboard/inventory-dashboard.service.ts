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

  // STORE-018 section 29: the operational action cards a Store user
  // actually needs to act on today - each count is a real query
  // against the same tables the underlying module already uses as its
  // source of truth (never a separately-maintained counter that could
  // drift). Where a spec-named card has no real pending-state in this
  // architecture (e.g. Production Returns are synchronous in this
  // system - STORE-014 - with no approval queue), it is reported as
  // notApplicable rather than a fabricated number.
  async getActionCards(user: any) {
    const companyId = user.companyId;

    const [
      waitingFromGate, physicalVerificationPending, iqcPending, iqcPassedPutAwayPending,
      iqcFailedRejectedPlacementPending, holdMaterial, woWaitingForMaterial,
      additionalMaterialApprovalPending, stockCountVariancePending,
      rtvApprovalPending, rtvGateOutPending, previousMaterialOverridePending,
    ] = await Promise.all([
      this.prisma.gateInwardEntry.count({ where: { companyId, status: 'PENDING' } }).catch(() => 0),
      this.prisma.storeReceiving.count({ where: { companyId, status: { in: ['DRAFT', 'PENDING'] } } }).catch(() => 0),
      this.prisma.iqcInspection.count({ where: { companyId, status: 'PENDING' } }),
      this.prisma.stockPutaway.count({ where: { companyId, status: 'IN_PROGRESS' } }),
      this.prisma.rejectedStockItem.count({ where: { rejectedStock: { companyId }, disposition: 'PENDING', isActive: true } }),
      this.prisma.holdStockItem.count({ where: { holdStock: { companyId }, reinspectionStatus: 'PENDING', isActive: true } }),
      this.prisma.workOrder.count({ where: { companyId, status: 'IN_PROGRESS', materialAvailability: { not: 'AVAILABLE' } } }),
      this.prisma.additionalMaterialRequest.count({ where: { companyId, status: 'PENDING', isActive: true } }),
      this.prisma.stockAdjustment.count({ where: { companyId, status: 'DRAFT' } }),
      this.prisma.rtvRequest.count({ where: { companyId, status: 'DRAFT', isActive: true } }),
      this.prisma.rtvRequest.count({ where: { companyId, status: { in: ['READY_FOR_GATE_OUT', 'PARTIALLY_GATE_OUT'] }, isActive: true } }),
      this.prisma.materialIssueOverride.count({ where: { companyId, status: 'PENDING' } }),
    ]);

    // reservedQty > availableQty can't be expressed as a single Prisma
    // where-clause across two columns - fetch the (normally small) set
    // of rows with any reservation and filter in memory.
    const reservedBalances = await this.prisma.stockBalance.findMany({
      where: { companyId, reservedQty: { gt: 0 } },
      select: { reservedQty: true, availableQty: true },
    });
    const reservationShortfallCount = reservedBalances.filter(b => b.reservedQty > b.availableQty + 0.0001).length;

    return {
      waitingFromGate,
      physicalVerificationPending,
      iqcPending,
      iqcPassedPutAwayPending,
      iqcFailedRejectedPlacementPending,
      holdMaterial,
      woWaitingForMaterial,
      previousMaterialOverridePending,
      additionalMaterialApprovalPending,
      productionReturnsPending: { notApplicable: true, reason: 'Production returns in this system (STORE-014) post immediately once Store verifies condition - there is no separate pending-approval queue for them.' },
      stockCountVariancePending,
      rtvApprovalPending,
      rtvGateOutPending,
      reservationShortfall: reservationShortfallCount,
    };
  }

  // STORE-018 sections 58-61: detects inconsistencies, never fixes
  // them. Every check reads current authoritative balances/documents
  // directly - this is not a second, separately-maintained ledger.
  async getReconciliation(user: any) {
    const companyId = user.companyId;
    const issues: any[] = [];

    // 1. Negative stock
    const negativeStock = await this.prisma.stockBalance.findMany({
      where: { companyId, availableQty: { lt: 0 } },
      select: { itemCode: true, warehouseId: true, availableQty: true },
    });
    for (const b of negativeStock) {
      issues.push({ severity: 'CRITICAL', check: 'NEGATIVE_STOCK', itemCode: b.itemCode, warehouseId: b.warehouseId, expected: 0, actual: b.availableQty, difference: b.availableQty });
    }

    // 2. Reserved > Available
    const reservedBalances = await this.prisma.stockBalance.findMany({
      where: { companyId, reservedQty: { gt: 0 } },
      select: { itemCode: true, warehouseId: true, reservedQty: true, availableQty: true },
    });
    for (const b of reservedBalances) {
      if (b.reservedQty > b.availableQty + 0.0001) {
        issues.push({ severity: 'CRITICAL', check: 'RESERVATION_SHORTFALL', itemCode: b.itemCode, warehouseId: b.warehouseId, expected: `<= ${b.availableQty}`, actual: b.reservedQty, difference: b.reservedQty - b.availableQty, recommendedAction: 'Review and reallocate or release the affected reservations - do not post any stock-reducing transaction for this item until resolved.' });
      }
    }

    // 3. Negative StockBatch balances
    const negativeBatches = await this.prisma.stockBatch.findMany({
      where: { companyId, availableQty: { lt: 0 } },
      select: { batchNumber: true, itemCode: true, availableQty: true },
    });
    for (const bt of negativeBatches) {
      issues.push({ severity: 'CRITICAL', check: 'NEGATIVE_BATCH', itemCode: bt.itemCode, batch: bt.batchNumber, expected: 0, actual: bt.availableQty, difference: bt.availableQty });
    }

    // 4. RTV gateOutQty exceeding preparedQty (should never happen given code paths, but data-level sanity check)
    const badRtvs = await this.prisma.rtvRequest.findMany({
      where: { companyId, isActive: true },
      select: { rtvNumber: true, itemCode: true, preparedQty: true, gateOutQty: true, approvedQty: true, requestedQty: true },
    });
    for (const r of badRtvs) {
      if (r.gateOutQty > r.preparedQty + 0.0001) {
        issues.push({ severity: 'CRITICAL', check: 'RTV_GATEOUT_EXCEEDS_PREPARED', itemCode: r.itemCode, reference: r.rtvNumber, expected: `<= ${r.preparedQty}`, actual: r.gateOutQty, difference: r.gateOutQty - r.preparedQty });
      }
      if (r.approvedQty != null && r.approvedQty > r.requestedQty + 0.0001) {
        issues.push({ severity: 'AMBER', check: 'RTV_APPROVED_EXCEEDS_REQUESTED', itemCode: r.itemCode, reference: r.rtvNumber, expected: `<= ${r.requestedQty}`, actual: r.approvedQty, difference: r.approvedQty - r.requestedQty });
      }
    }

    // 5. Orphan reservations - reservation referencing a WO that no longer exists (should be impossible via FK, but check for cancelled/completed WOs still carrying reservedQty)
    const orphanReservations = await this.prisma.materialReservation.findMany({
      where: { status: 'ACTIVE', workOrder: { companyId, status: { in: ['CANCELLED', 'COMPLETED'] } } },
      select: { id: true, itemCode: true, reservedQty: true, workOrderId: true, workOrder: { select: { woNumber: true, status: true } } },
    }).catch(() => []);
    for (const res of orphanReservations) {
      if (res.reservedQty > 0.0001) {
        issues.push({ severity: 'AMBER', check: 'ORPHAN_RESERVATION', itemCode: res.itemCode, reference: res.workOrder?.woNumber, expected: 0, actual: res.reservedQty, difference: res.reservedQty, recommendedAction: `Work order is ${res.workOrder?.status} but still holds an ACTIVE reservation - review and release.` });
      }
    }

    const critical = issues.filter(i => i.severity === 'CRITICAL').length;
    const amber = issues.filter(i => i.severity === 'AMBER').length;
    const health = critical > 0 ? 'RED' : (amber > 0 ? 'AMBER' : 'GREEN');

    return { health, criticalCount: critical, amberCount: amber, issues };
  }
}
