import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class DispatchReservationService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.dispatchReservation.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `DR-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      dispatchPlan: { select: { planNumber: true } },
      salesOrder: { select: { soNumber: true, customerName: true } },
      requiredStage: { select: { stageName: true } },
      workOrder: { select: { woNumber: true } },
    };
  }

  // DSP-005 section 7-10: atomically claims up to wantQty from Free
  // (available - reserved) for one item across every eligible
  // warehouse at the plan's resolved plant - the exact same
  // optimistic-lock retry pattern StoreMaterialReservationService
  // already uses for Production, on the SAME reservedQty field, so
  // Production and Dispatch commitments always coexist correctly
  // against one authoritative balance. Never trusts a DSP-003
  // snapshot - re-reads and re-validates right here.
  private async claimRmFgAtomically(companyId: string, itemCode: string, warehouseType: string, plantId: string, wantQty: number, userId: string): Promise<{ claimed: number; warehouseId: string | null }> {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { companyId, plantId, type: { in: [warehouseType, 'GENERAL'] as any }, isActive: true },
      select: { id: true },
    });
    let remaining = wantQty;
    let totalClaimed = 0;
    let lastWarehouseId: string | null = null;
    for (const wh of warehouses) {
      if (remaining <= 0.0001) break;
      const MAX_RETRIES = 5;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const stock = await this.prisma.stockBalance.findFirst({ where: { companyId, itemCode, warehouseId: wh.id } });
        if (!stock) break;
        const freeAvailable = Math.max(stock.availableQty - stock.reservedQty, 0);
        const claimQty = Math.min(freeAvailable, remaining);
        if (claimQty <= 0.0001) break;
        const claim = await this.prisma.stockBalance.updateMany({
          where: { id: stock.id, reservedQty: stock.reservedQty },
          data: { reservedQty: { increment: claimQty }, updatedBy: userId },
        });
        if (claim.count === 1) {
          totalClaimed += claimQty;
          remaining -= claimQty;
          lastWarehouseId = wh.id;
          break;
        }
        // Concurrent change - loop retries with a fresh read.
      }
    }
    return { claimed: totalClaimed, warehouseId: lastWarehouseId };
  }

  // DSP-005 sections 13-19: atomically claims SFG output across every
  // eligible Work Order at the exact required stage, database-atomic
  // per WO via the same raw-SQL conditional UPDATE pattern already
  // used in stage-transfers.service.ts - and it is that SAME field
  // (dispatchReservedQty) that stage-transfers now subtracts from its
  // own transferable balance, so reserved SFG output can never also
  // move forward to the next stage even under concurrent attempts.
  private async claimSfgAtomically(companyId: string, itemCode: string, stageName: string, plantId: string, wantQty: number, userId: string): Promise<Array<{ workOrderId: string; claimed: number }>> {
    const wos = await this.prisma.workOrder.findMany({
      where: {
        companyId, productCode: itemCode, stageName,
        status: { in: ['RELEASED', 'IN_PROGRESS', 'COMPLETED'] },
        warehouse: { plantId },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    let remaining = wantQty;
    const allocations: Array<{ workOrderId: string; claimed: number }> = [];
    for (const wo of wos) {
      if (remaining <= 0.0001) break;
      const MAX_RETRIES = 5;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const w = await this.prisma.workOrder.findUnique({ where: { id: wo.id }, select: { completedQty: true, cumulativeHandoverQty: true, dispatchReservedQty: true, stageStatus: true } });
        if (!w || w.stageStatus === 'BLOCKED') break;
        const free = Math.max(w.completedQty - w.cumulativeHandoverQty - w.dispatchReservedQty, 0);
        const claimQty = Math.min(free, remaining);
        if (claimQty <= 0.0001) break;
        const updated: number = await this.prisma.$executeRaw`
          UPDATE work_orders SET "dispatchReservedQty" = "dispatchReservedQty" + ${claimQty}, "updatedBy" = ${userId}
          WHERE id = ${wo.id} AND "completedQty" - "cumulativeHandoverQty" - "dispatchReservedQty" >= ${claimQty}
        `;
        if (updated === 1) {
          allocations.push({ workOrderId: wo.id, claimed: claimQty });
          remaining -= claimQty;
          break;
        }
        // Concurrent change (a transfer or another reservation) -
        // loop retries with a fresh read.
      }
    }
    return allocations;
  }

  // DSP-005 section 72: the full reservation transaction. Revalidates
  // everything fresh - never trusts a DSP-003/DSP-004 snapshot.
  async reserve(dispatchPlanItemId: string, requestedQty: number, user: any) {
    const planItem = await this.prisma.dispatchPlanItem.findFirst({
      where: { id: dispatchPlanItemId, isActive: true, plan: { companyId: user.companyId } },
      include: { plan: true, soItem: { include: { requiredStage: true } } },
    });
    if (!planItem) throw new NotFoundException('Dispatch Plan line not found');
    if (planItem.plan.status === 'CANCELLED') throw new BadRequestException('This Dispatch Plan is cancelled');
    if (!planItem.soItem.sourceValid || !planItem.sourceType) throw new BadRequestException('This line has no valid resolved source');

    // DSP-005 section 34: cumulative active reservation against THIS
    // plan line must never exceed its own planned qty - the plan's own
    // ceiling, already itself bounded against SO demand by DSP-004.
    const alreadyReservedAgg = await this.prisma.dispatchReservation.aggregate({
      where: { dispatchPlanItemId, isActive: true, status: { in: ['ACTIVE', 'PARTIALLY_RELEASED'] } },
      _sum: { reservedQty: true, releasedQty: true },
    });
    const netAlreadyReserved = (alreadyReservedAgg._sum.reservedQty || 0) - (alreadyReservedAgg._sum.releasedQty || 0);
    const roomInPlan = Math.max(planItem.plannedQty - netAlreadyReserved, 0);
    if (roomInPlan <= 0.0001) {
      throw new BadRequestException(`This plan line is already fully reserved (${netAlreadyReserved} of ${planItem.plannedQty}).`);
    }
    const wantQty = Math.min(requestedQty, roomInPlan);

    const reservationNumber = await this.generateNumber(user.companyId);
    const created: any[] = [];
    let totalClaimed = 0;

    if (planItem.sourceType === 'RM_INVENTORY' || planItem.sourceType === 'FG_INVENTORY') {
      const warehouseType = planItem.sourceType === 'RM_INVENTORY' ? 'RAW_MATERIAL' : 'FINISHED_GOOD';
      const { claimed, warehouseId } = await this.claimRmFgAtomically(user.companyId, planItem.itemCode, warehouseType, planItem.sourcePlantId!, wantQty, user.id);
      if (claimed > 0.0001) {
        const row = await this.prisma.dispatchReservation.create({
          data: {
            companyId: user.companyId, reservationNumber, dispatchPlanId: planItem.planId, dispatchPlanItemId: planItem.id,
            soId: planItem.soItem.soId, soItemId: planItem.soItemId, itemCode: planItem.itemCode, itemName: planItem.itemName,
            reservationType: planItem.sourceType === 'RM_INVENTORY' ? 'RM_DISPATCH' : 'FG_DISPATCH',
            warehouseId, reservedQty: claimed, status: 'ACTIVE',
            createdBy: user.id, updatedBy: user.id,
          },
          include: this.includes(),
        });
        created.push(row);
        totalClaimed = claimed;
      }
    } else if (planItem.sourceType === 'SFG_STAGE') {
      const allocations = await this.claimSfgAtomically(user.companyId, planItem.itemCode, planItem.soItem.requiredStage!.stageName, planItem.sourcePlantId!, wantQty, user.id);
      for (const alloc of allocations) {
        const row = await this.prisma.dispatchReservation.create({
          data: {
            companyId: user.companyId, reservationNumber, dispatchPlanId: planItem.planId, dispatchPlanItemId: planItem.id,
            soId: planItem.soItem.soId, soItemId: planItem.soItemId, itemCode: planItem.itemCode, itemName: planItem.itemName,
            reservationType: 'SFG_DISPATCH', workOrderId: alloc.workOrderId, requiredStageId: planItem.requiredStageId,
            reservedQty: alloc.claimed, status: 'ACTIVE',
            createdBy: user.id, updatedBy: user.id,
          },
          include: this.includes(),
        });
        created.push(row);
        totalClaimed += alloc.claimed;
      }
    } else {
      throw new BadRequestException(`Unrecognized source type "${planItem.sourceType}"`);
    }

    const status = totalClaimed <= 0.0001 ? 'NOT_RESERVED' : totalClaimed >= wantQty - 0.0001 ? 'FULLY_RESERVED' : 'PARTIALLY_RESERVED';

    await this.audit.log({
      tableName: 'dispatch_reservations', recordId: reservationNumber, action: 'CREATE',
      newValues: { reservationNumber, dispatchPlanItemId, requestedQty, totalClaimed, status, allocations: created.map(c => ({ id: c.id, workOrderId: c.workOrderId, warehouseId: c.warehouseId, reservedQty: c.reservedQty })) },
      changedBy: user.id,
    });

    return { reservationNumber, requestedQty, reservedQty: totalClaimed, unreservedQty: Math.max(wantQty - totalClaimed, 0), status, allocations: created };
  }

  // DSP-005 sections 37-40: releases up to releaseQty across the
  // ACTIVE allocation rows sharing this reservationNumber, reversing
  // exactly the same field each allocation incremented.
  async release(reservationNumber: string, releaseQty: number, reason: string | undefined, user: any) {
    const rows = await this.prisma.dispatchReservation.findMany({
      where: { reservationNumber, companyId: user.companyId, isActive: true, status: { in: ['ACTIVE', 'PARTIALLY_RELEASED'] } },
    });
    if (rows.length === 0) throw new NotFoundException('Active reservation not found');

    let remaining = releaseQty;
    const released: any[] = [];
    for (const row of rows) {
      if (remaining <= 0.0001) break;
      const stillHeld = row.reservedQty - row.releasedQty;
      const thisRelease = Math.min(stillHeld, remaining);
      if (thisRelease <= 0.0001) continue;

      if (row.reservationType === 'SFG_DISPATCH' && row.workOrderId) {
        await this.prisma.workOrder.update({ where: { id: row.workOrderId }, data: { dispatchReservedQty: { decrement: thisRelease } } });
      } else if (row.warehouseId) {
        await this.prisma.stockBalance.updateMany({ where: { companyId: user.companyId, itemCode: row.itemCode, warehouseId: row.warehouseId }, data: { reservedQty: { decrement: thisRelease } } });
      }

      const newReleasedQty = row.releasedQty + thisRelease;
      const newStatus = newReleasedQty >= row.reservedQty - 0.0001 ? 'RELEASED' : 'PARTIALLY_RELEASED';
      const updated = await this.prisma.dispatchReservation.update({
        where: { id: row.id },
        data: { releasedQty: newReleasedQty, status: newStatus, releaseReason: reason, updatedBy: user.id },
      });
      released.push(updated);
      remaining -= thisRelease;
    }

    await this.audit.log({
      tableName: 'dispatch_reservations', recordId: reservationNumber, action: 'UPDATE',
      newValues: { released: released.map(r => ({ id: r.id, releasedQty: r.releasedQty, status: r.status })), reason },
      changedBy: user.id,
    });

    return { reservationNumber, releasedQty: releaseQty - Math.max(remaining, 0), rows: released };
  }

  async findOne(reservationNumber: string, user: any) {
    const rows = await this.prisma.dispatchReservation.findMany({
      where: { reservationNumber, companyId: user.companyId },
      include: this.includes(),
    });
    if (rows.length === 0) throw new NotFoundException('Reservation not found');
    return rows;
  }

  async findByPlanItem(dispatchPlanItemId: string, user: any) {
    return this.prisma.dispatchReservation.findMany({
      where: { dispatchPlanItemId, companyId: user.companyId, isActive: true },
      include: this.includes(),
      orderBy: { createdAt: 'desc' },
    });
  }
}
