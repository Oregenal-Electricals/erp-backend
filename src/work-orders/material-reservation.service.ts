import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';

const PRIORITY_RANK: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 };

@Injectable()
export class MaterialReservationService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // Called when a Work Order is released. Reserves real stock for every
  // BOM item it needs. If there isn't enough free stock, pulls from
  // lower-priority Work Orders' existing reservations first - never
  // touching material that's already been physically issued to the
  // floor (tracked separately via ProductionIssueItem), and never
  // touching a Work Order that's already COMPLETED or CANCELLED.
  // Every reallocation is written to the audit log; there is no
  // approval step by design.
  async reserveForWorkOrder(workOrderId: string, user: any) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { bom: { include: { items: { where: { isActive: true } } } } },
    });
    if (!wo || !wo.bom) return [];

    const results: any[] = [];

    for (const bomItem of wo.bom.items) {
      const requiredQty = (bomItem.effectiveQty || bomItem.quantity) * wo.plannedQty;
      let stillNeeded = requiredQty;

      const stock = await this.prisma.stockBalance.findUnique({
        where: {
          companyId_itemCode_warehouseId: {
            companyId: wo.companyId,
            itemCode: bomItem.itemCode,
            warehouseId: wo.warehouseId,
          },
        },
      });

      const freeQty = Math.min(stock?.availableQty || 0, stillNeeded);
      if (freeQty > 0 && stock) {
        await this.prisma.stockBalance.update({
          where: { id: stock.id },
          data: { availableQty: { decrement: freeQty }, reservedQty: { increment: freeQty } },
        });
        await this.prisma.materialReservation.create({
          data: {
            companyId: wo.companyId, workOrderId, itemCode: bomItem.itemCode,
            itemName: bomItem.itemName, warehouseId: wo.warehouseId,
            reservedQty: freeQty, status: 'ACTIVE',
            createdBy: user.id, updatedBy: user.id,
          },
        });
        stillNeeded -= freeQty;
      }

      if (stillNeeded > 0.0001) {
        const candidates = await this.prisma.materialReservation.findMany({
          where: {
            itemCode: bomItem.itemCode, warehouseId: wo.warehouseId,
            status: 'ACTIVE', companyId: wo.companyId,
            workOrderId: { not: workOrderId },
          },
          include: { workOrder: true },
        });

        const eligible = candidates
          .filter(r =>
            !['COMPLETED', 'CANCELLED'].includes(r.workOrder.status) &&
            (PRIORITY_RANK[r.workOrder.priority] || 2) < (PRIORITY_RANK[wo.priority] || 2)
          )
          .sort((a, b) =>
            (PRIORITY_RANK[a.workOrder.priority] || 2) - (PRIORITY_RANK[b.workOrder.priority] || 2)
            || a.createdAt.getTime() - b.createdAt.getTime()
          );

        for (const cand of eligible) {
          if (stillNeeded <= 0.0001) break;

          const issuedAgg = await this.prisma.productionIssueItem.aggregate({
            where: {
              itemCode: bomItem.itemCode,
              productionIssue: { workOrderId: cand.workOrderId, status: 'ISSUED' },
            },
            _sum: { issuedQty: true },
          });
          const alreadyIssued = issuedAgg._sum.issuedQty || 0;
          const reallocatable = Math.max(0, cand.reservedQty - alreadyIssued);
          if (reallocatable <= 0.0001) continue;

          const takeQty = Math.min(reallocatable, stillNeeded);

          if (takeQty >= cand.reservedQty - 0.0001) {
            await this.prisma.materialReservation.update({
              where: { id: cand.id },
              data: { status: 'RELEASED', releasedReason: `Reallocated to higher-priority WO ${wo.woNumber}`, updatedBy: user.id },
            });
          } else {
            await this.prisma.materialReservation.update({
              where: { id: cand.id },
              data: { reservedQty: { decrement: takeQty } },
            });
          }

          await this.prisma.materialReservation.create({
            data: {
              companyId: wo.companyId, workOrderId, itemCode: bomItem.itemCode,
              itemName: bomItem.itemName, warehouseId: wo.warehouseId,
              reservedQty: takeQty, status: 'ACTIVE',
              releasedReason: `Reallocated from WO ${cand.workOrder.woNumber} (priority ${wo.priority} > ${cand.workOrder.priority})`,
              createdBy: user.id, updatedBy: user.id,
            },
          });

          await this.audit.log({
            tableName: 'material_reservations', recordId: cand.id, action: 'UPDATE',
            oldValues: { workOrder: cand.workOrder.woNumber, itemCode: bomItem.itemCode, qty: takeQty },
            newValues: { reallocatedTo: wo.woNumber, reason: 'higher priority' },
            changedBy: user.id,
          });

          stillNeeded -= takeQty;
        }
      }

      results.push({
        itemCode: bomItem.itemCode, itemName: bomItem.itemName,
        requiredQty, reservedQty: requiredQty - stillNeeded, shortfallQty: Math.max(0, stillNeeded),
      });
    }

    return results;
  }

  // Reservations were being created on release but never released or
  // consumed on completion/cancellation - meaning reservedQty grew forever
  // and material never actually left stock even after being used in
  // production. This closes that gap:
  // - consumed=true (WO completed): the material genuinely left the
  //   warehouse into the finished product, so it comes out of reservedQty
  //   permanently, with a ledger entry for traceability.
  // - consumed=false (WO cancelled): nothing was actually used, so it goes
  //   back into availableQty for other work orders to use.
  async releaseReservations(workOrderId: string, user: any, consumed: boolean) {
    const reservations = await this.prisma.materialReservation.findMany({
      where: { workOrderId, status: 'ACTIVE' },
    });
    for (const r of reservations) {
      const balance = await this.prisma.stockBalance.findFirst({
        where: { companyId: r.companyId, itemCode: r.itemCode, warehouseId: r.warehouseId },
      });
      if (balance) {
        if (consumed) {
          const consumedValue = r.reservedQty * balance.unitCost;
          await this.prisma.stockBalance.update({
            where: { id: balance.id },
            data: { reservedQty: { decrement: r.reservedQty }, totalValue: { decrement: consumedValue } },
          });
          await this.prisma.stockLedger.create({
            data: {
              companyId: r.companyId, itemCode: r.itemCode, itemName: r.itemName, warehouseId: r.warehouseId,
              transactionType: 'PRODUCTION_CONSUMPTION', referenceType: 'WORK_ORDER', referenceId: workOrderId,
              inQty: 0, outQty: r.reservedQty,
              balanceQty: balance.availableQty + balance.reservedQty - r.reservedQty,
              unitCost: balance.unitCost, totalCost: consumedValue,
              remarks: 'Consumed on Work Order completion',
              createdBy: user.id, updatedBy: user.id,
            },
          });
        } else {
          await this.prisma.stockBalance.update({
            where: { id: balance.id },
            data: { reservedQty: { decrement: r.reservedQty }, availableQty: { increment: r.reservedQty } },
          });
        }
      }
      await this.prisma.materialReservation.update({
        where: { id: r.id },
        data: {
          status: 'RELEASED',
          releasedReason: consumed ? 'Consumed on WO completion' : 'WO cancelled',
          updatedBy: user.id,
        },
      });
    }
    return { released: reservations.length };
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
