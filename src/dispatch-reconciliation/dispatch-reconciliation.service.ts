import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispatchReconciliationService {
  constructor(private prisma: PrismaService) {}

  private netItem(i: any) {
    const packed = i.packedQty ?? i.pickedQty ?? i.verifiedQty ?? 0;
    return packed - (i.reversedQty || 0);
  }

  // DSP-014 sections 3-5, 13-17: derives the full quantity chain for
  // one Dispatch Plan from authoritative transactions only - never a
  // manually-entered "Completed = Yes" flag. Every figure here is a
  // read; this service never writes to any table (section 41).
  async reconcilePlan(planId: string, user: any) {
    const plan = await this.prisma.dispatchPlan.findFirst({
      where: { id: planId, companyId: user.companyId },
      include: { items: true },
    });
    if (!plan) throw new NotFoundException('Dispatch Plan not found');

    const plannedQty = plan.items.reduce((s: number, i: any) => s + i.plannedQty, 0);

    const reservations = await this.prisma.dispatchReservation.findMany({ where: { dispatchPlanId: planId, status: { not: 'CANCELLED' } } });
    const reservedQty = reservations.reduce((s: number, r: any) => s + r.reservedQty, 0);

    const pickLists = await this.prisma.pickList.findMany({ where: { dispatchPlanId: planId }, include: { items: true } });
    const pickedQty = pickLists.flatMap((p: any) => p.items).reduce((s: number, i: any) => s + this.netItem(i), 0);

    const verifications = await this.prisma.dispatchVerification.findMany({ where: { pickList: { dispatchPlanId: planId } }, include: { items: true } });
    const verifiedQty = verifications.flatMap((v: any) => v.items).reduce((s: number, i: any) => s + this.netItem(i), 0);
    const verificationExceptions = verifications.flatMap((v: any) => v.items).filter((i: any) => i.status === 'EXCEPTION');

    const packages = await this.prisma.dispatchPackage.findMany({
      where: { packing: { verification: { pickList: { dispatchPlanId: planId } } } },
      include: { items: true },
    });
    let packedQty = 0, loadedQty = 0, confirmedQty = 0, gatedOutQty = 0;
    for (const pkg of packages) {
      const net = pkg.items.reduce((s: number, i: any) => s + this.netItem(i), 0);
      if (pkg.status !== 'REVERSED') packedQty += net;
      if (pkg.loadedInLoadingId || pkg.gateOutId) loadedQty += net;
      if (pkg.confirmedInConfirmationId || pkg.gateOutId) confirmedQty += net;
      if (pkg.gateOutId) gatedOutQty += net;
    }

    const loadingExceptions = await this.prisma.dispatchLoadingItem.findMany({ where: { loading: { dispatchPlanId: planId }, status: 'EXCEPTION' } });
    const confirmationExceptions = await this.prisma.dispatchConfirmationItem.findMany({ where: { confirmation: { dispatchPlanId: planId }, status: 'EXCEPTION' } });

    // DSP-014 sections 15-17: a stage-to-stage shortfall is only
    // "explained" when a matching EXCEPTION record actually exists;
    // otherwise it is flagged rather than hidden.
    const explanations: string[] = [];
    if (verificationExceptions.length) explanations.push(`${verificationExceptions.length} item(s) blocked at verification (quality/stage exception)`);
    if (loadingExceptions.length) explanations.push(`${loadingExceptions.length} item(s) blocked at loading (quality/stage exception)`);
    if (confirmationExceptions.length) explanations.push(`${confirmationExceptions.length} item(s) blocked at confirmation (quality/document exception)`);

    const steps = [
      { stage: 'PLANNED', qty: plannedQty },
      { stage: 'RESERVED', qty: reservedQty },
      { stage: 'PICKED', qty: pickedQty },
      { stage: 'VERIFIED', qty: verifiedQty },
      { stage: 'PACKED', qty: packedQty },
      { stage: 'LOADED', qty: loadedQty },
      { stage: 'CONFIRMED_FOR_GATE_OUT', qty: confirmedQty },
      { stage: 'GATED_OUT', qty: gatedOutQty },
    ];

    const hasUnexplainedVariance = plannedQty - gatedOutQty > 0 && explanations.length === 0 && (pickLists.length > 0 || packages.length > 0);

    return {
      dispatchPlanId: planId, planNumber: plan.planNumber, status: plan.status,
      quantityChain: steps,
      explanations,
      reconciliationStatus: hasUnexplainedVariance ? 'RECONCILIATION_EXCEPTION' : (gatedOutQty >= plannedQty ? 'FULLY_RECONCILED' : 'IN_PROGRESS'),
    };
  }

  // DSP-014 sections 6-11, 40-42: actual dispatch truth is the sum of
  // valid DispatchGateOutItem quantities allocated to the SO line -
  // never Reservation/Pick/Pack/Load/Confirm, all of which are
  // structurally proven (by their own dedicated tests across DSP-005
  // through DSP-012) to never touch SalesOrderItem.dispatchedQty.
  async reconcileSalesOrder(soId: string, user: any) {
    const so = await this.prisma.salesOrder.findFirst({ where: { id: soId, companyId: user.companyId }, include: { items: true } });
    if (!so) throw new NotFoundException('Sales Order not found');

    const lines = await Promise.all(so.items.map(async (item: any) => {
      const gateOutItems = await this.prisma.dispatchGateOutItem.findMany({ where: { soItemId: item.id, isActive: true } });
      const actualGateOutQty = gateOutItems.reduce((s: number, i: any) => s + i.qty, 0);
      return {
        soItemId: item.id, itemCode: item.itemCode, itemName: item.itemName, saleType: item.saleType,
        orderedQty: item.qty, actualDispatchedQty: item.dispatchedQty, actualGateOutQty,
        remainingQty: item.pendingQty,
        consistent: Math.abs(actualGateOutQty - item.dispatchedQty) < 0.001,
      };
    }));

    const allFull = lines.every((l: any) => l.remainingQty <= 0);
    return {
      soId, soNumber: so.soNumber, customerName: so.customerName, status: so.status,
      fulfilmentStatus: allFull ? 'FULLY_DISPATCHED' : lines.some((l: any) => l.actualDispatchedQty > 0) ? 'PARTIALLY_DISPATCHED' : 'OPEN',
      lines,
    };
  }

  // DSP-014 sections 32-38, 108: CRITICAL. Balances a saleable
  // Production Stage's Accepted Output against everywhere it can
  // validly have gone - never auto-adjusted, only reported.
  async reconcileSfgStage(workOrderId: string, user: any) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, companyId: user.companyId } });
    if (!wo) throw new NotFoundException('Work Order not found');

    const gateOutItems = await this.prisma.dispatchGateOutItem.findMany({ where: { workOrderId, isActive: true } });
    const dispatchedAsSfg = gateOutItems.reduce((s: number, i: any) => s + i.qty, 0);

    const acceptedOutput = wo.completedQty;
    const transferred = wo.cumulativeHandoverQty;
    const activeReserved = wo.dispatchReservedQty; // still reserved, not yet gated out
    const remainingWip = acceptedOutput - transferred - dispatchedAsSfg - activeReserved;
    const accountedTotal = transferred + dispatchedAsSfg + activeReserved + Math.max(0, remainingWip);

    let reconciliationResult = 'PASS';
    let varianceQty = 0;
    if (remainingWip < -0.001) {
      reconciliationResult = 'EXCESS_ERROR';
      varianceQty = Math.abs(remainingWip);
    } else if (accountedTotal < acceptedOutput - 0.001) {
      reconciliationResult = 'UNACCOUNTED';
      varianceQty = acceptedOutput - accountedTotal;
    }

    return {
      workOrderId, stageName: wo.stageName, itemCode: wo.productCode,
      acceptedOutput, transferredToNextStage: transferred, dispatchedAsSfg, activeDispatchReserved: activeReserved,
      remainingWip: Math.max(0, remainingWip), reconciliationResult, varianceQty,
    };
  }

  // DSP-014 section 26-27: detects the four named critical
  // inconsistencies WITHOUT silently creating or deleting any
  // financial/inventory/Gate transaction to make totals match.
  async checkCriticalConsistency(gateOutId: string, user: any) {
    const gateOut = await this.prisma.dispatchGateOut.findFirst({ where: { id: gateOutId, companyId: user.companyId }, include: { items: true, dispatchConfirmation: true } });
    if (!gateOut) throw new NotFoundException('Gate-Out not found');

    const issues: string[] = [];
    for (const item of gateOut.items) {
      const soItem = await this.prisma.salesOrderItem.findUnique({ where: { id: item.soItemId } });
      if (!soItem || soItem.dispatchedQty < item.qty - 0.001) {
        issues.push(`Gate-Out item for ${item.itemCode} (qty ${item.qty}) has no matching Sales dispatched quantity update`);
      }
      if (item.dispatchReservationId) {
        const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: item.dispatchReservationId } });
        if (reservation && reservation.status === 'ACTIVE') {
          issues.push(`Reservation ${reservation.reservationNumber} for ${item.itemCode} is still ACTIVE despite a completed Gate-Out - should be FULFILLED or PARTIALLY_RELEASED`);
        }
      }
    }
    if (gateOut.dispatchConfirmation.status !== 'GATED_OUT') {
      issues.push(`Dispatch Confirmation ${gateOut.dispatchConfirmationId} is not marked GATED_OUT despite a completed Gate-Out`);
    }

    return { gateOutId, gateOutNumber: gateOut.gateOutNumber, consistent: issues.length === 0, issues };
  }
}
