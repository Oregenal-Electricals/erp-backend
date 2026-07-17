import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { MaterialReservationService } from '../work-orders/material-reservation.service';

@Injectable()
export class MrpService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private materialReservation: MaterialReservationService,
  ) {}

  async calculateMrp(woId: string, user: any) {
    const companyId = user.companyId;

    const wo = await this.prisma.workOrder.findFirst({
      where: { id: woId, companyId },
      include: { warehouse: { select: { name: true } } },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (!wo.bomId) throw new BadRequestException('Work order has no BOM linked');
    if (['COMPLETED', 'CANCELLED'].includes(wo.status)) {
      throw new BadRequestException('Cannot run MRP for completed/cancelled work order');
    }

    const bom = await this.prisma.bom.findFirst({
      where: { id: wo.bomId, companyId },
      include: { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } },
    });
    if (!bom) throw new NotFoundException('BOM not found');

    const requirements = [];
    let hasShortage = false;

    for (const item of bom.items) {
      const grossQty = item.effectiveQty * wo.plannedQty;
      const wasteQty = (item.wastagePercent || 0) / 100 * grossQty;
      const netRequired = grossQty + wasteQty;

      const balance = await this.prisma.stockBalance.findFirst({
        where: { companyId, itemCode: item.itemCode },
      });
      const availableQty = balance?.availableQty || 0;

      const batches = await this.prisma.stockBatch.findMany({
        where: { companyId, itemCode: item.itemCode, status: 'ACTIVE', availableQty: { gt: 0 } },
        orderBy: { receivedDate: 'asc' },
        select: { batchNumber: true, availableQty: true, expiryDate: true, receivedDate: true },
      });

      const shortage = Math.max(0, netRequired - availableQty);
      if (shortage > 0) hasShortage = true;

      requirements.push({
        sequence: item.sequence,
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        itemType: item.itemType,
        qtyPer: item.quantity,
        wastagePercent: item.wastagePercent || 0,
        grossRequired: grossQty,
        netRequired: Math.round(netRequired * 1000) / 1000,
        availableQty,
        shortage: Math.round(shortage * 1000) / 1000,
        status: shortage > 0 ? 'SHORTAGE' : availableQty === 0 ? 'NO_STOCK' : 'AVAILABLE',
        batches: batches.slice(0, 5),
      });
    }

    return {
      workOrder: {
        id: wo.id, woNumber: wo.woNumber, productCode: wo.productCode,
        productName: wo.productName, plannedQty: wo.plannedQty,
        status: wo.status, warehouse: wo.warehouse?.name,
      },
      bom: { bomNumber: bom.bomNumber, version: bom.version },
      requirements,
      summary: {
        totalComponents: requirements.length,
        availableComponents: requirements.filter(r => r.status === 'AVAILABLE').length,
        shortageComponents: requirements.filter(r => r.status === 'SHORTAGE').length,
        noStockComponents: requirements.filter(r => r.status === 'NO_STOCK').length,
        hasShortage,
        canProduce: !hasShortage,
      },
    };
  }

  async getShortageReport(user: any) {
    const companyId = user.companyId;
    const activeWOs = await this.prisma.workOrder.findMany({
      where: { companyId, status: { in: ['RELEASED', 'IN_PROGRESS'] }, bomId: { not: null } },
      include: { warehouse: { select: { name: true } } },
    });

    const report = [];
    for (const wo of activeWOs) {
      try {
        const mrp = await this.calculateMrp(wo.id, user);
        if (mrp.summary.hasShortage) {
          report.push({
            woNumber: wo.woNumber, productCode: wo.productCode,
            productName: wo.productName, plannedQty: wo.plannedQty,
            status: wo.status, warehouse: wo.warehouse?.name,
            shortageItems: mrp.requirements.filter(r => r.shortage > 0).map(r => ({
              itemCode: r.itemCode, itemName: r.itemName, uom: r.uom,
              required: r.netRequired, available: r.availableQty, shortage: r.shortage,
            })),
          });
        }
      } catch (e) { /* skip WOs with BOM issues */ }
    }

    return { data: report, totalWOs: activeWOs.length, wosWithShortage: report.length };
  }

  async getMaterialPlan(user: any, query: any) {
    const companyId = user.companyId;
    const { status = 'RELEASED' } = query;

    const wos = await this.prisma.workOrder.findMany({
      where: { companyId, status: { in: status.split(',') }, bomId: { not: null } },
    });

    const aggregate: Record<string, any> = {};

    for (const wo of wos) {
      try {
        const mrp = await this.calculateMrp(wo.id, user);
        for (const req of mrp.requirements) {
          const key = req.itemCode;
          if (!aggregate[key]) {
            aggregate[key] = {
              itemCode: req.itemCode, itemName: req.itemName, uom: req.uom,
              totalRequired: 0, totalAvailable: req.availableQty,
              totalShortage: 0, woCount: 0,
            };
          }
          aggregate[key].totalRequired += req.netRequired;
          aggregate[key].totalShortage = Math.max(0, aggregate[key].totalRequired - aggregate[key].totalAvailable);
          aggregate[key].woCount += 1;
        }
      } catch (e) { /* skip */ }
    }

    const data = Object.values(aggregate).sort((a: any, b: any) => b.totalShortage - a.totalShortage);
    return { data, totalWOs: wos.length, totalItems: data.length };
  }

  async getPlanningBoard(user: any, warehouseId: string) {
    const companyId = user.companyId;
    if (!warehouseId) throw new BadRequestException('warehouseId is required');

    const sos = await this.prisma.salesOrder.findMany({
      where: { companyId, status: 'CONFIRMED' },
      include: { items: { where: { isActive: true, pendingQty: { gt: 0 } } } },
      orderBy: { deliveryDate: 'asc' },
    });

    const board = [];
    for (const so of sos) {
      if (so.items.length === 0) continue;
      const itemsOut = [];
      for (const item of so.items) {
        const product = await this.prisma.product.findFirst({ where: { companyId, code: item.itemCode } });
        const bom = product
          ? await this.prisma.bom.findFirst({
              where: { companyId, productId: product.id, status: 'APPROVED' },
              include: { items: { where: { isActive: true } } },
            })
          : null;

        const alreadyPlanned = await this.prisma.workOrder.aggregate({
          where: { companyId, salesOrderId: so.id, productCode: item.itemCode, status: { not: 'CANCELLED' } },
          _sum: { plannedQty: true },
        });
        const remainingToPlan = Math.max(0, item.pendingQty - (alreadyPlanned._sum.plannedQty || 0));

        const rmRequirements = [];
        if (bom) {
          for (const bi of bom.items) {
            const balance = await this.prisma.stockBalance.findUnique({
              where: { companyId_itemCode_warehouseId: { companyId, itemCode: bi.itemCode, warehouseId } },
            });
            rmRequirements.push({
              itemCode: bi.itemCode, itemName: bi.itemName, uom: bi.uom,
              qtyPerUnit: bi.effectiveQty, availableQty: balance?.availableQty || 0,
            });
          }
        }

        itemsOut.push({
          soItemId: item.id, itemCode: item.itemCode, itemName: item.itemName,
          pendingQty: item.pendingQty, alreadyPlannedQty: alreadyPlanned._sum.plannedQty || 0,
          remainingToPlan, hasBom: !!bom, bomId: bom?.id || null, rmRequirements,
        });
      }
      if (itemsOut.some(i => i.remainingToPlan > 0)) {
        board.push({
          soId: so.id, soNumber: so.soNumber, customerName: so.customerName,
          deliveryDate: so.deliveryDate, items: itemsOut,
        });
      }
    }
    return board;
  }

  async runAllocation(dto: { warehouseId: string; allocations: { soItemId: string; buildQty: number }[] }, user: any) {
    const companyId = user.companyId;
    const active = (dto.allocations || []).filter(a => a.buildQty > 0);
    if (active.length === 0) throw new BadRequestException('No build quantities entered');
    if (!dto.warehouseId) throw new BadRequestException('warehouseId is required');

    const resolved: any[] = [];
    for (const a of active) {
      const soItem = await this.prisma.salesOrderItem.findFirst({
        where: { id: a.soItemId, salesOrder: { companyId } },
        include: { salesOrder: true },
      });
      if (!soItem) throw new NotFoundException(`Sales order item ${a.soItemId} not found`);
      const product = await this.prisma.product.findFirst({ where: { companyId, code: soItem.itemCode } });
      if (!product) throw new BadRequestException(`No product master found for item code ${soItem.itemCode}`);
      const bom = await this.prisma.bom.findFirst({
        where: { companyId, productId: product.id, status: 'APPROVED' },
        include: { items: { where: { isActive: true } } },
      });
      if (!bom) throw new BadRequestException(`No approved BOM found for ${soItem.itemCode}`);
      resolved.push({ soItem, product, bom, buildQty: a.buildQty });
    }

    const needByItem: Record<string, { itemName: string; uom: string; totalNeeded: number }> = {};
    for (const r of resolved) {
      for (const bi of r.bom.items) {
        const need = bi.effectiveQty * r.buildQty;
        if (!needByItem[bi.itemCode]) needByItem[bi.itemCode] = { itemName: bi.itemName, uom: bi.uom, totalNeeded: 0 };
        needByItem[bi.itemCode].totalNeeded += need;
      }
    }

    const shortages: any[] = [];
    for (const [itemCode, need] of Object.entries(needByItem)) {
      const balance = await this.prisma.stockBalance.findUnique({
        where: { companyId_itemCode_warehouseId: { companyId, itemCode, warehouseId: dto.warehouseId } },
      });
      const available = balance?.availableQty || 0;
      if (need.totalNeeded > available + 0.0001) {
        shortages.push({
          itemCode, itemName: need.itemName, uom: need.uom,
          totalNeeded: Math.round(need.totalNeeded * 1000) / 1000,
          available, shortfall: Math.round((need.totalNeeded - available) * 1000) / 1000,
        });
      }
    }

    if (shortages.length > 0) {
      return { feasible: false, shortages, createdWorkOrders: [] };
    }

    const createdWorkOrders = [];
    for (const r of resolved) {
      const woNumber = await this.generateWoNumber(companyId);
      const wo = await this.prisma.workOrder.create({
        data: {
          woNumber, productCode: r.product.code, productName: r.product.name,
          uom: r.soItem.uom || 'PCS', bomId: r.bom.id, warehouseId: dto.warehouseId,
          plannedQty: r.buildQty,
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          priority: 'MEDIUM', salesOrderId: r.soItem.salesOrder.id,
          remarks: `Auto-planned from ${r.soItem.salesOrder.soNumber}`,
          companyId, createdBy: user.id, updatedBy: user.id,
        },
      });
      await this.audit.log({ tableName: 'work_orders', recordId: wo.id, action: 'CREATE', newValues: wo, changedBy: user.id });
      const reservations = await this.materialReservation.reserveForWorkOrder(wo.id, user);
      await this.prisma.workOrder.update({ where: { id: wo.id }, data: { status: 'RELEASED' } });
      createdWorkOrders.push({
        woId: wo.id, woNumber, soNumber: r.soItem.salesOrder.soNumber,
        productCode: r.product.code, buildQty: r.buildQty, reservations,
      });
    }

    return { feasible: true, shortages: [], createdWorkOrders };
  }

  private async generateWoNumber(companyId: string): Promise<string> {
    const count = await this.prisma.workOrder.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `WO-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
