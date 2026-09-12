import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class MaterialReservationService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // STORE-011: reserves real stock for every BOM item a Work Order
  // needs. Reservation is purely a commitment - it moves qty from Free
  // Available into Reserved within the SAME StockBalance.availableQty
  // total (availableQty is never touched here); physical stock never
  // actually leaves the warehouse at this step. That happens later, at
  // ProductionIssueService.confirm() time. If Free Available can't
  // cover the full requirement, this reserves whatever is free and
  // reports the shortfall as a partial reservation - it never
  // automatically steals from another Work Order's existing
  // reservation. A genuine reallocation is a separate, explicit,
  // authorized action (release, then re-reserve, with audit) - not
  // something this method does silently on its own.
  async reserveForWorkOrder(workOrderId: string, user: any) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { bom: { include: { items: { where: { isActive: true } } } } },
    });
    if (!wo || !wo.bom) return [];

    const results: any[] = [];

    for (const bomItem of wo.bom.items) {
      const requiredQty = (bomItem.effectiveQty || bomItem.quantity) * wo.plannedQty;

      // Already reserved for THIS WO/item (e.g. a prior partial
      // reservation attempt) - never reserve past what this WO's own
      // requirement still needs.
      const existingForThisWo = await this.prisma.materialReservation.aggregate({
        where: { workOrderId, itemCode: bomItem.itemCode, status: 'ACTIVE' },
        _sum: { reservedQty: true },
      });
      const alreadyReservedForWo = existingForThisWo._sum.reservedQty || 0;
      const stillNeeded = Math.max(0, requiredQty - alreadyReservedForWo);

      let reservedNow = 0;
      if (stillNeeded > 0.0001) {
        reservedNow = await this.reserveQtyAtomically(wo.companyId, bomItem.itemCode, wo.warehouseId, stillNeeded, user.id);
        if (reservedNow > 0) {
          await this.prisma.materialReservation.create({
            data: {
              companyId: wo.companyId, workOrderId, itemCode: bomItem.itemCode,
              itemName: bomItem.itemName, warehouseId: wo.warehouseId,
              reservedQty: reservedNow, status: 'ACTIVE',
              createdBy: user.id, updatedBy: user.id,
            },
          });
          await this.audit.log({
            tableName: 'material_reservations', recordId: workOrderId, action: 'CREATE',
            newValues: { workOrder: wo.woNumber, itemCode: bomItem.itemCode, reservedQty: reservedNow, requiredQty },
            changedBy: user.id,
          });
        }
      }

      results.push({
        itemCode: bomItem.itemCode, itemName: bomItem.itemName,
        requiredQty, reservedQty: alreadyReservedForWo + reservedNow,
        shortfallQty: Math.max(0, requiredQty - alreadyReservedForWo - reservedNow),
      });
    }

    return results;
  }

  // Atomically claims up to wantQty from Free Available (available -
  // reserved) for one item/warehouse. Retries with a fresh read if a
  // concurrent reservation changed reservedQty in between the read and
  // the write here, rather than ever letting two simultaneous callers
  // both succeed against the same stale starting balance. Returns
  // however much it actually managed to claim (0 if nothing was free).
  private async reserveQtyAtomically(companyId: string, itemCode: string, warehouseId: string, wantQty: number, userId: string): Promise<number> {
    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const stock = await this.prisma.stockBalance.findFirst({ where: { companyId, itemCode, warehouseId } });
      if (!stock) return 0;
      const freeAvailable = Math.max(stock.availableQty - stock.reservedQty, 0);
      const claimQty = Math.min(freeAvailable, wantQty);
      if (claimQty <= 0.0001) return 0;

      const claim = await this.prisma.stockBalance.updateMany({
        where: { id: stock.id, reservedQty: stock.reservedQty },
        data: { reservedQty: { increment: claimQty }, updatedBy: userId },
      });
      if (claim.count === 1) return claimQty;
      // Someone else changed reservedQty in between - loop retries with a fresh read.
    }
    throw new BadRequestException(`Could not reserve stock for ${itemCode} - too many concurrent updates, please retry.`);
  }

  // STORE-011 sections 28-31: releases whatever portion of each active
  // reservation was never actually issued. The issued portion already
  // physically left the warehouse - ProductionIssueService.confirm()
  // already decremented both availableQty and reservedQty for it - and
  // is never touched again here. A release never restores physical
  // stock; it only removes the unissued reservedQty commitment.
  async releaseReservations(workOrderId: string, user: any, consumed: boolean) {
    const reason = consumed ? 'Unused reservation released on Work Order completion' : 'Work Order cancelled';
    const reservations = await this.prisma.materialReservation.findMany({
      where: { workOrderId, status: 'ACTIVE' },
    });
    for (const r of reservations) {
      const unissued = Math.max(0, r.reservedQty - r.issuedQty);
      if (unissued > 0.0001) {
        await this.prisma.stockBalance.updateMany({
          where: { companyId: r.companyId, itemCode: r.itemCode, warehouseId: r.warehouseId },
          data: { reservedQty: { decrement: unissued } },
        });
      }
      await this.prisma.materialReservation.update({
        where: { id: r.id },
        data: { status: 'RELEASED', releasedReason: reason, updatedBy: user.id },
      });
    }
    return { released: reservations.length };
  }

  // Called by ProductionIssueService.confirm() at the moment material
  // actually, physically leaves the warehouse for this Work Order/item.
  // Allocates the issued qty across this WO's active reservations for
  // that item (oldest first), keeping each reservation's own issuedQty
  // accurate for later release calculations. Returns whatever couldn't
  // be matched to an existing reservation (e.g. an issue with no prior
  // reservation at all).
  async recordIssueAgainstReservations(workOrderId: string, itemCode: string, issuedQty: number, user: any): Promise<number> {
    let remaining = issuedQty;
    const reservations = await this.prisma.materialReservation.findMany({
      where: { workOrderId, itemCode, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
    for (const r of reservations) {
      if (remaining <= 0.0001) break;
      const unissued = Math.max(0, r.reservedQty - r.issuedQty);
      if (unissued <= 0.0001) continue;
      const take = Math.min(unissued, remaining);
      await this.prisma.materialReservation.update({
        where: { id: r.id },
        data: { issuedQty: { increment: take }, updatedBy: user.id },
      });
      remaining -= take;
    }
    return remaining;
  }

  async findForWorkOrder(workOrderId: string) {
    return this.prisma.materialReservation.findMany({
      where: { workOrderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(user: any, query: any) {
    const where: any = { companyId: user.companyId };
    if (query.itemCode) where.itemCode = query.itemCode;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.status) where.status = query.status;
    return this.prisma.materialReservation.findMany({
      where,
      include: { workOrder: { select: { woNumber: true, priority: true, status: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
