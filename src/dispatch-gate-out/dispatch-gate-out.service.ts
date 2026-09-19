import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { DispatchDocumentReadinessService } from '../dispatch-document-readiness/dispatch-document-readiness.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';

@Injectable()
export class DispatchGateOutService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private readiness: DispatchDocumentReadinessService,
    private stockLedger: StockLedgerService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.dispatchGateOut.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `GO-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      dispatchConfirmation: { select: { confirmationNumber: true, confirmationType: true } },
      transportAssignment: { select: { assignmentNumber: true, vehicleNumber: true, transporterName: true } },
      dispatchPlan: { select: { planNumber: true } },
      salesOrder: { select: { soNumber: true, customerName: true } },
      items: true,
    };
  }

  private async revalidatePackageQuality(pkg: any): Promise<{ ok: boolean; reason?: string }> {
    for (const item of pkg.items) {
      const verificationItem = await this.prisma.dispatchVerificationItem.findUnique({ where: { id: item.verificationItemId } });
      if (!verificationItem) continue;
      const pickListItem = await this.prisma.pickListItem.findUnique({ where: { id: verificationItem.pickListItemId } });
      if (!pickListItem) continue;
      if (pickListItem.batchId) {
        const batch = await this.prisma.stockBatch.findUnique({ where: { id: pickListItem.batchId } });
        if (!batch || batch.status !== 'ACTIVE') return { ok: false, reason: batch?.status === 'QUARANTINED' ? 'QUALITY_HOLD' : 'BLOCKED_STOCK' };
      } else if (verificationItem.saleType === 'SFG') {
        const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } });
        if (reservation?.workOrderId) {
          const wo = await this.prisma.workOrder.findUnique({ where: { id: reservation.workOrderId } });
          if (!wo || wo.stageStatus === 'BLOCKED') return { ok: false, reason: 'STAGE_MISMATCH' };
        }
      }
    }
    return { ok: true };
  }

  // DSP-013 section 27: this is the ONLY place in the entire DSP-005
  // through DSP-013 chain that touches physical stock or Sales Order
  // dispatched quantity - every prior module (Reservation, Pick,
  // Verify, Pack, Transport, Load, Confirm) is proven, by its own
  // dedicated tests, to never write to StockBalance or
  // SalesOrderItem.dispatchedQty. Reuses the exact same
  // StockLedgerService.postTransaction() the pre-existing
  // src/dispatch module already uses for RM/FG, and mirrors that
  // module's own SalesOrderItem update logic exactly, rather than
  // inventing a second parallel stock-outward mechanism.
  async confirmGateOut(dispatchConfirmationId: string, actualVehicleNumber: string | undefined, user: any) {
    // DSP-013 sections 51-52: idempotency FIRST - a retried request
    // for a confirmation that already has a Gate-Out returns the
    // existing event rather than creating a duplicate physical
    // outward.
    const existing = await this.prisma.dispatchGateOut.findUnique({ where: { dispatchConfirmationId }, include: this.includes() });
    if (existing) return existing;

    const confirmation = await this.prisma.dispatchConfirmation.findFirst({
      where: { id: dispatchConfirmationId, companyId: user.companyId },
      include: { transportAssignment: true, items: { where: { isActive: true, status: 'CONFIRMED' } } },
    });
    if (!confirmation) throw new NotFoundException('Dispatch Confirmation not found');
    if (confirmation.status !== 'READY_FOR_GATE_OUT') {
      throw new BadRequestException(`This Dispatch Confirmation is ${confirmation.status}, not READY FOR GATE-OUT`);
    }
    if (actualVehicleNumber && confirmation.transportAssignment.vehicleNumber && actualVehicleNumber !== confirmation.transportAssignment.vehicleNumber) {
      throw new BadRequestException(`Vehicle mismatch: expected ${confirmation.transportAssignment.vehicleNumber}, actual ${actualVehicleNumber}. Gate-Out blocked pending controlled correction.`);
    }

    // DSP-013 section 43-44: revalidate documents fresh, not the
    // DSP-012 snapshot.
    const docReadiness = await this.readiness.checkReadiness(confirmation.dispatchPlanId, user);
    if (docReadiness.overall !== 'DOCUMENTS_READY') {
      throw new BadRequestException(`Gate-Out blocked: commercial documents are ${docReadiness.overall}, not ready.`);
    }

    const packages = await this.prisma.dispatchPackage.findMany({
      where: { id: { in: confirmation.items.map((i: any) => i.packageId) }, isActive: true, status: 'ACTIVE' },
      include: { items: true },
    });
    if (packages.length === 0) throw new BadRequestException('No valid confirmed packages found for Gate-Out');

    // DSP-013 sections 46-47: fresh quality revalidation across every
    // package - a HOLD placed after confirmation still blocks the
    // whole event rather than silently gating out a partial set.
    for (const pkg of packages) {
      const quality = await this.revalidatePackageQuality(pkg);
      if (!quality.ok) throw new BadRequestException(`Gate-Out blocked: package quality is ${quality.reason}.`);
    }

    const gateOutNumber = await this.generateNumber(user.companyId);

    // Header is created FIRST (with no items yet) so the atomic
    // per-package claim below has a real, already-committed
    // dispatch_gate_outs.id to point its foreign key at - claiming
    // against a not-yet-existing id would violate the FK constraint.
    const gateOut = await this.prisma.dispatchGateOut.create({
      data: {
        gateOutNumber, dispatchConfirmationId, transportAssignmentId: confirmation.transportAssignmentId,
        dispatchPlanId: confirmation.dispatchPlanId, soId: confirmation.soId, customerName: confirmation.customerName,
        vehicleNumber: confirmation.transportAssignment.vehicleNumber, gateOutBy: user.id,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });

    for (const pkg of packages) {
      // DSP-013 section 55: same atomic conditional-claim pattern as
      // every prior stage - a package cannot physically Gate-Out
      // twice, or through two different dispatches. Also finalizes
      // the package's outward status in the same atomic statement.
      const claim: number = await this.prisma.$executeRaw`
        UPDATE dispatch_packages SET "gateOutId" = ${gateOut.id}, "status" = 'DISPATCHED', "updatedBy" = ${user.id}
        WHERE id = ${pkg.id} AND "gateOutId" IS NULL
      `;
      if (claim === 0) throw new BadRequestException(`Package ${pkg.packageNumber} has already been Gated-Out`);

      for (const item of pkg.items) {
        const verificationItem = await this.prisma.dispatchVerificationItem.findUnique({ where: { id: item.verificationItemId } });
        if (!verificationItem) continue;
        const pickListItem = await this.prisma.pickListItem.findUnique({ where: { id: verificationItem.pickListItemId } });
        if (!pickListItem) continue;

        const netQty = item.packedQty - item.reversedQty;
        if (netQty <= 0) continue;

        const soItem = await this.prisma.salesOrderItem.findUnique({ where: { id: pickListItem.soItemId } });
        if (!soItem) continue;

        // DSP-013 sections 26-29, 79-81: exactly-once physical
        // deduction. RM/FG post through the authoritative stock
        // ledger (StockBalance.availableQty); SFG permanently
        // decrements WorkOrder.dispatchReservedQty (the exact counter
        // DSP-005 committed) rather than any StockBalance row - it
        // never returns to Production and never becomes FG.
        if (pickListItem.batchId) {
          const batch = await this.prisma.stockBatch.findUnique({ where: { id: pickListItem.batchId } });
          if (batch) {
            const balance = await this.prisma.stockBalance.findFirst({ where: { companyId: user.companyId, itemCode: verificationItem.itemCode, warehouseId: batch.warehouseId } });
            if (balance) {
              await this.stockLedger.postTransaction({
                companyId: user.companyId, itemCode: verificationItem.itemCode, itemName: verificationItem.itemName,
                warehouseId: batch.warehouseId, transactionType: 'ISSUE', referenceType: 'DISPATCH_GATE_OUT', referenceNumber: gateOutNumber,
                outQty: netQty, unitCost: balance.unitCost, remarks: `Gate-Out against SO ${confirmation.customerName}`, userId: user.id,
              });
            }
          }
        } else if (verificationItem.saleType === 'SFG') {
          const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } });
          if (reservation?.workOrderId) {
            await this.prisma.workOrder.update({
              where: { id: reservation.workOrderId },
              data: { dispatchReservedQty: { decrement: netQty } },
            });
          }
        }

        // DSP-013 sections 35-38: reuses the exact SalesOrderItem
        // update logic as the pre-existing src/dispatch module,
        // line-wise.
        const newDispatched = soItem.dispatchedQty + netQty;
        const newPending = Math.max(0, soItem.qty - newDispatched);
        await this.prisma.salesOrderItem.update({ where: { id: soItem.id }, data: { dispatchedQty: newDispatched, pendingQty: newPending, updatedBy: user.id } });

        // DSP-013 sections 32-34, 66: consumes the DSP-005
        // reservation permanently - FULFILLED, never back to free
        // stock, distinct from the 'RELEASED' status DSP-005/006 use
        // for an actual release-to-free-stock event.
        if (pickListItem.dispatchReservationId) {
          const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } });
          if (reservation) {
            const newReleased = reservation.releasedQty + netQty;
            await this.prisma.dispatchReservation.update({
              where: { id: reservation.id },
              data: { releasedQty: newReleased, status: newReleased >= reservation.reservedQty ? 'FULFILLED' : 'PARTIALLY_RELEASED' },
            });
          }
        }

        await this.prisma.dispatchGateOutItem.create({
          data: {
            gateOutId: gateOut.id, packageId: pkg.id, soItemId: soItem.id, itemCode: verificationItem.itemCode, itemName: verificationItem.itemName,
            saleType: verificationItem.saleType, qty: netQty,
            warehouseId: pickListItem.batchId ? (await this.prisma.stockBatch.findUnique({ where: { id: pickListItem.batchId } }))?.warehouseId : null,
            workOrderId: verificationItem.saleType === 'SFG' ? (await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } }))?.workOrderId : null,
            dispatchReservationId: pickListItem.dispatchReservationId,
            createdBy: user.id, updatedBy: user.id,
          },
        });
      }
    }

    // DSP-013 section 65: blocks any further DSP-012 reversal.
    await this.prisma.dispatchConfirmation.update({ where: { id: dispatchConfirmationId }, data: { status: 'GATED_OUT', updatedBy: user.id } });

    // DSP-013 sections 40-41: mirrors the pre-existing module's own
    // SO-level rollup - partial stays open, full moves the header.
    const updatedSo = await this.prisma.salesOrder.findFirst({ where: { id: confirmation.soId }, include: { items: true } });
    if (updatedSo) {
      const allDispatched = updatedSo.items.every((i: any) => i.pendingQty <= 0);
      await this.prisma.salesOrder.update({ where: { id: confirmation.soId }, data: { status: allDispatched ? 'DISPATCHED' : 'PARTIALLY_DISPATCHED', updatedBy: user.id } });
    }

    await this.audit.log({ tableName: 'dispatch_gate_outs', recordId: gateOut.id, action: 'CREATE', newValues: gateOut, changedBy: user.id });
    return this.findOne(gateOut.id, user);
  }

  async findOne(id: string, user: any) {
    const gateOut = await this.prisma.dispatchGateOut.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!gateOut) throw new NotFoundException('Gate-Out not found');
    return gateOut;
  }
}
