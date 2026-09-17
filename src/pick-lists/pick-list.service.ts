import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class PickListService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.pickList.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PL-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      dispatchPlan: { select: { planNumber: true } },
      salesOrder: { select: { soNumber: true, customerName: true } },
      items: {
        include: {
          dispatchReservation: { select: { reservationNumber: true, reservationType: true, reservedQty: true, releasedQty: true, warehouseId: true, workOrderId: true } },
          batch: { select: { batchNumber: true, lotNumber: true } },
        },
      },
    };
  }

  // DSP-006 section 6: originates only from an active Dispatch Plan
  // that already has at least one active reservation - never from
  // unreserved demand.
  async createPickList(dispatchPlanId: string, user: any) {
    const plan = await this.prisma.dispatchPlan.findFirst({ where: { id: dispatchPlanId, companyId: user.companyId } });
    if (!plan) throw new NotFoundException('Dispatch Plan not found');
    if (plan.status === 'CANCELLED') throw new BadRequestException('This Dispatch Plan is cancelled');

    const hasReservations = await this.prisma.dispatchReservation.count({
      where: { dispatchPlanId, isActive: true, status: { in: ['ACTIVE', 'PARTIALLY_RELEASED'] } },
    });
    if (hasReservations === 0) throw new BadRequestException('This Dispatch Plan has no active reservation to pick against');

    const pickListNumber = await this.generateNumber(user.companyId);
    const pickList = await this.prisma.pickList.create({
      data: {
        pickListNumber, dispatchPlanId, soId: plan.soId, customerName: plan.customerName,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'pick_lists', recordId: pickList.id, action: 'CREATE', newValues: pickList, changedBy: user.id });
    return pickList;
  }

  // DSP-006 section 29, 37-38: the ceiling for a pick event is what's
  // still un-picked WITHIN this specific reservation allocation -
  // reservedQty minus releasedQty (DSP-005's own commitment) minus
  // whatever has already been picked/not-reversed from it. The picked
  // portion is never a second, independent claim on top of the
  // reservation - it is that reservation, just physically identified.
  private async remainingToPick(tx: any, dispatchReservationId: string, reservedQty: number, releasedQty: number) {
    const agg = await tx.pickListItem.aggregate({
      where: { dispatchReservationId, isActive: true },
      _sum: { pickedQty: true, reversedQty: true },
    });
    const netPicked = (agg._sum.pickedQty || 0) - (agg._sum.reversedQty || 0);
    return Math.max(reservedQty - releasedQty - netPicked, 0);
  }

  // DSP-006 sections 10, 13, 20, 26: for RM/FG, revalidates the exact
  // batch at pick time (never trusts the reservation snapshot) and
  // atomically claims batch-level capacity via the same optimistic-
  // lock pattern used throughout this Dispatch chain. This narrows
  // WHICH physical stock fulfils an already-committed reservation -
  // it does not create a second, independent commitment against
  // StockBalance.reservedQty (already claimed by DSP-005).
  private async claimBatchAtomically(companyId: string, batchId: string, itemCode: string, warehouseId: string | null, wantQty: number, userId: string): Promise<number> {
    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const batch = await this.prisma.stockBatch.findFirst({ where: { id: batchId, companyId } });
      if (!batch) throw new NotFoundException('Batch not found');
      if (batch.itemCode !== itemCode) throw new BadRequestException(`Batch ${batch.batchNumber} is for a different item`);
      if (warehouseId && batch.warehouseId !== warehouseId) throw new BadRequestException(`Batch ${batch.batchNumber} is not in the reserved warehouse`);
      if (batch.status !== 'ACTIVE') throw new BadRequestException(`Batch ${batch.batchNumber} is ${batch.status} and not eligible for picking`);
      const free = Math.max(batch.availableQty - batch.reservedQty, 0);
      const claimQty = Math.min(free, wantQty);
      if (claimQty <= 0.0001) throw new BadRequestException(`Batch ${batch.batchNumber} has no free quantity to pick`);
      const claim = await this.prisma.stockBatch.updateMany({
        where: { id: batch.id, reservedQty: batch.reservedQty },
        data: { reservedQty: { increment: claimQty }, updatedBy: userId },
      });
      if (claim.count === 1) return claimQty;
      // Concurrent change - loop retries with a fresh read.
    }
    throw new BadRequestException('Could not claim batch - too many concurrent updates, please retry.');
  }

  async pickItem(pickListId: string, dispatchReservationId: string, batchId: string | undefined, pickQty: number, user: any) {
    const pickList = await this.prisma.pickList.findFirst({ where: { id: pickListId, companyId: user.companyId } });
    if (!pickList) throw new NotFoundException('Pick List not found');
    if (pickList.status === 'CANCELLED') throw new BadRequestException('This Pick List is cancelled');

    const reservation = await this.prisma.dispatchReservation.findFirst({
      where: { id: dispatchReservationId, companyId: user.companyId, dispatchPlanId: pickList.dispatchPlanId, isActive: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found on this Dispatch Plan');
    if (!['ACTIVE', 'PARTIALLY_RELEASED'].includes(reservation.status)) {
      throw new BadRequestException(`Reservation ${reservation.reservationNumber} is ${reservation.status} and not eligible for picking`);
    }

    // DSP-006 section 47-48: physical selection must match the exact
    // allocation the reservation already locked in - never a silent
    // substitution to a different WO/stage or warehouse.
    if (reservation.reservationType === 'SFG_DISPATCH') {
      const wo = await this.prisma.workOrder.findUnique({ where: { id: reservation.workOrderId! } });
      if (!wo || wo.stageStatus === 'BLOCKED') {
        throw new BadRequestException('This Work Order/stage is Blocked and not eligible for picking (quality revalidation failed)');
      }
    }

    const remaining = await this.remainingToPick(this.prisma, dispatchReservationId, reservation.reservedQty, reservation.releasedQty);
    if (pickQty > remaining) {
      throw new BadRequestException(`Pick qty ${pickQty} exceeds what remains to pick on this reservation (${remaining}).`);
    }

    let actualPicked = pickQty;
    if (reservation.reservationType !== 'SFG_DISPATCH' && batchId) {
      actualPicked = await this.claimBatchAtomically(user.companyId, batchId, reservation.itemCode, reservation.warehouseId, pickQty, user.id);
    }

    const item = await this.prisma.pickListItem.create({
      data: {
        pickListId, dispatchReservationId, soItemId: reservation.soItemId, itemCode: reservation.itemCode, itemName: reservation.itemName,
        saleType: reservation.reservationType.replace('_DISPATCH', ''), batchId: reservation.reservationType === 'SFG_DISPATCH' ? null : (batchId || null),
        pickedQty: actualPicked, status: 'ACTIVE',
        createdBy: user.id, updatedBy: user.id,
      },
    });

    // Recompute pick list header status from all its items vs their reservations
    await this.refreshPickListStatus(pickListId, user);

    await this.audit.log({
      tableName: 'pick_list_items', recordId: item.id, action: 'CREATE',
      newValues: { pickListId, dispatchReservationId, batchId, requestedQty: pickQty, actualPicked },
      changedBy: user.id,
    });

    return { ...item, requestedQty: pickQty, shortQty: Math.max(pickQty - actualPicked, 0) };
  }

  private async refreshPickListStatus(pickListId: string, user: any) {
    const items = await this.prisma.pickListItem.findMany({ where: { pickListId, isActive: true } });
    const resIds = [...new Set(items.map(i => i.dispatchReservationId))];
    const reservations = await this.prisma.dispatchReservation.findMany({ where: { id: { in: resIds } } });
    const totalReserved = reservations.reduce((s, r) => s + (r.reservedQty - r.releasedQty), 0);
    const totalPicked = items.reduce((s, i) => s + (i.pickedQty - i.reversedQty), 0);
    const status = totalPicked <= 0.0001 ? 'CREATED' : totalPicked >= totalReserved - 0.0001 ? 'PICKED' : 'PARTIALLY_PICKED';
    await this.prisma.pickList.update({ where: { id: pickListId }, data: { status, updatedBy: user.id } });
  }

  // DSP-006 sections 56-58: reversing a pick undoes the physical
  // batch-level claim only - it explicitly does NOT touch the
  // DispatchReservation itself, so the customer's underlying
  // commitment remains protected unless separately released via
  // DSP-005's own release().
  async reversePick(pickListItemId: string, reverseQty: number, reason: string | undefined, user: any) {
    const item = await this.prisma.pickListItem.findFirst({
      where: { id: pickListItemId, isActive: true, pickList: { companyId: user.companyId } },
    });
    if (!item) throw new NotFoundException('Pick event not found');
    const stillPicked = item.pickedQty - item.reversedQty;
    if (reverseQty > stillPicked) throw new BadRequestException(`Cannot reverse ${reverseQty} - only ${stillPicked} is currently picked.`);

    if (item.batchId) {
      await this.prisma.stockBatch.updateMany({ where: { id: item.batchId }, data: { reservedQty: { decrement: reverseQty } } });
    }

    const newReversedQty = item.reversedQty + reverseQty;
    const updated = await this.prisma.pickListItem.update({
      where: { id: item.id },
      data: { reversedQty: newReversedQty, status: newReversedQty >= item.pickedQty - 0.0001 ? 'REVERSED' : 'ACTIVE', reason, updatedBy: user.id },
    });
    await this.refreshPickListStatus(item.pickListId, user);
    await this.audit.log({ tableName: 'pick_list_items', recordId: item.id, action: 'UPDATE', newValues: { reversedQty: newReversedQty, reason }, changedBy: user.id });
    return updated;
  }

  async findOne(id: string, user: any) {
    const pickList = await this.prisma.pickList.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!pickList) throw new NotFoundException('Pick List not found');
    return pickList;
  }

  // DSP-006 section 25: system-suggested pick, oldest batch first
  // (FIFO) among eligible ACTIVE batches for this item/warehouse.
  async suggestBatches(dispatchReservationId: string, user: any) {
    const reservation = await this.prisma.dispatchReservation.findFirst({ where: { id: dispatchReservationId, companyId: user.companyId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.reservationType === 'SFG_DISPATCH') return [];
    const batches = await this.prisma.stockBatch.findMany({
      where: { companyId: user.companyId, itemCode: reservation.itemCode, warehouseId: reservation.warehouseId!, status: 'ACTIVE', isActive: true },
      orderBy: { receivedDate: 'asc' },
    });
    return batches
      .map(b => ({ batchId: b.id, batchNumber: b.batchNumber, lotNumber: b.lotNumber, freeQty: Math.max(b.availableQty - b.reservedQty, 0) }))
      .filter(b => b.freeQty > 0.0001);
  }
}
