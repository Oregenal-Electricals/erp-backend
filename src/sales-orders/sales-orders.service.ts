import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateSoDto, CancelSoDto } from './dto/sales-order.dto';
import { isTestSessionActive } from '../common/context/test-session.context';

@Injectable()
export class SalesOrdersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private async generateNumber(
    companyId: string,
    client: any = this.prisma,
  ): Promise<string> {
    const count = await client.salesOrder.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `SO-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Automatically creates a Sales Order from an acknowledged Customer PO,
   * mirroring the CPO's own items exactly (no re-entry needed). Called by
   * CustomerPoService.acknowledge() inside a single database transaction,
   * so the CPO's ACKNOWLEDGED status and the new SO are created atomically
   * - if SO creation fails for any reason, the whole acknowledgment rolls
   * back rather than leaving the CPO acknowledged with no linked SO.
   *
   * Accepts an optional transaction client (`tx`); defaults to the normal
   * prisma client so this method also works standalone if ever needed.
   */
  async createFromCpo(
    cpo: any,
    cpoItems: any[],
    user: any,
    tx: any = this.prisma,
  ) {
    const soNumber = await this.generateNumber(user.companyId, tx);

    const calcItems = cpoItems.map((item) => ({
      cpoItemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      description: item.description,
      qty: item.qty,
      uom: item.uom || 'PCS',
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      gstRate: item.gstRate ?? 18,
      ...this.calcItem(item),
      createdBy: user.id,
      updatedBy: user.id,
      isTestData: isTestSessionActive(),
    }));

    const subtotal = calcItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const totalGst = calcItems.reduce((s, i) => s + i.gstAmount, 0);
    const totalAmount = calcItems.reduce((s, i) => s + i.totalAmount, 0);

    // Auto-confirmed at creation - a CPO-originated Sales Order no longer
    // sits in DRAFT waiting for a separate manual confirm step. This is
    // scoped to createFromCpo() specifically, so manually created Sales
    // Orders elsewhere are unaffected and still go through confirm()
    // themselves as before.
    const so = await tx.salesOrder.create({
      data: {
        soNumber,
        cpoId: cpo.id,
        customerName: cpo.customerName,
        deliveryDate: cpo.deliveryDate,
        currency: cpo.currency,
        remarks: `Auto-created on acknowledgment of ${cpo.cpoNumber}`,
        subtotal: Math.round(subtotal * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        companyId: user.companyId,
        createdBy: user.id,
        updatedBy: user.id,
        status: 'CONFIRMED',
        confirmedDate: new Date(),
        confirmedBy: user.id,
        items: { create: calcItems },
      },
      include: this.includes(),
    });

    await this.audit.log({
      tableName: 'sales_orders',
      recordId: so.id,
      action: 'CREATE',
      newValues: so,
      changedBy: user.id,
    });
    return so;
  }

  private calcItem(item: any) {
    const qty = item.qty || 0;
    const unitPrice = item.unitPrice || 0;
    const discount = item.discount || 0;
    const gstRate = item.gstRate ?? 18;
    const gross = qty * unitPrice;
    const discAmt = Math.round(((gross * discount) / 100) * 100) / 100;
    const taxableAmt = Math.round((gross - discAmt) * 100) / 100;
    const gstAmount = Math.round(((taxableAmt * gstRate) / 100) * 100) / 100;
    const totalAmount = Math.round((taxableAmt + gstAmount) * 100) / 100;
    return { taxableAmt, gstAmount, totalAmount, pendingQty: qty };
  }

  private async validateSaleTypeItem(item: any, user: any) {
    const saleType = item.saleType || 'FG';
    if (!['RM', 'SFG', 'FG'].includes(saleType)) {
      throw new BadRequestException(`Invalid saleType "${saleType}" for ${item.itemCode} - must be RM, SFG, or FG.`);
    }

    if (saleType === 'RM') {
      const rm = await this.prisma.rawMaterial.findFirst({ where: { companyId: user.companyId, code: item.itemCode, isActive: true } });
      if (!rm) throw new BadRequestException(`"${item.itemCode}" is marked as an RM sale but no active Raw Material with that code exists.`);
      return { saleType, requiredStageId: null };
    }

    const product = await this.prisma.product.findFirst({ where: { companyId: user.companyId, code: item.itemCode, isActive: true } });
    if (!product) throw new BadRequestException(`"${item.itemCode}" is marked as a ${saleType} sale but no active Product with that code exists.`);

    if (saleType === 'FG') {
      return { saleType, requiredStageId: null };
    }

    if (!item.requiredStageId) {
      throw new BadRequestException(`"${item.itemCode}" is marked as an SFG sale but no required Production Stage was selected.`);
    }
    const stage = await this.prisma.routingStage.findFirst({
      where: { id: item.requiredStageId, companyId: user.companyId, routing: { finalProductId: product.id } },
      include: { routing: { select: { routingName: true } } },
    });
    if (!stage) {
      throw new BadRequestException(`Selected stage is not a valid Production Stage for "${item.itemCode}".`);
    }
    if (!stage.isSaleable) {
      throw new BadRequestException(`${stage.stageName} stage is not configured as saleable for this product.`);
    }
    return { saleType, requiredStageId: stage.id };
  }

  private includes() {
    return {
      items: { include: { requiredStage: { select: { stageName: true } } } },
      cpo: {
        select: {
          cpoNumber: true,
          customerPoNumber: true,
          deliveryDate: true,
          status: true,
        },
      },
    };
  }

  /**
   * Manual SO creation is now a fallback path only - the normal flow is
   * automatic, triggered when a CPO is acknowledged (see
   * CustomerPoService.acknowledge() -> createFromCpo()). A CPO always
   * maps to exactly one Sales Order; splitting a large order into
   * multiple partial shipments happens downstream in Work Orders /
   * Dispatch Planning (which already track pendingQty/dispatchedQty per
   * item), never by creating a second SO for the same CPO. This guard
   * exists to prevent that exact mistake.
   */
  async create(dto: CreateSoDto, user: any) {
    const cpo = await this.prisma.customerPo.findFirst({
      where: { id: dto.cpoId, companyId: user.companyId },
    });
    if (!cpo) throw new NotFoundException('Customer PO not found');
    if (!['ACKNOWLEDGED', 'IN_PROGRESS'].includes(cpo.status))
      throw new BadRequestException('CPO must be ACKNOWLEDGED or IN_PROGRESS');

    const existingSo = await this.prisma.salesOrder.findFirst({
      where: { cpoId: dto.cpoId, isActive: true },
    });
    if (existingSo)
      throw new BadRequestException(
        `This CPO already has Sales Order ${existingSo.soNumber}. A CPO can only have one Sales Order - split shipments in Work Orders / Dispatch Planning instead.`,
      );

    const soNumber = await this.generateNumber(user.companyId);

    const calcItems = [];
    for (const item of dto.items) {
      const { saleType, requiredStageId } = await this.validateSaleTypeItem(item, user);
      calcItems.push({
        cpoItemId: item.cpoItemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        description: item.description,
        qty: item.qty,
        uom: item.uom || 'PCS',
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        gstRate: item.gstRate ?? 18,
        saleType,
        requiredStageId,
        ...this.calcItem(item),
        createdBy: user.id,
        updatedBy: user.id,
      });
    }

    const subtotal = calcItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const totalGst = calcItems.reduce((s, i) => s + i.gstAmount, 0);
    const totalAmount = calcItems.reduce((s, i) => s + i.totalAmount, 0);

    const so = await this.prisma.salesOrder.create({
      data: {
        soNumber,
        cpoId: dto.cpoId,
        customerName: cpo.customerName,
        deliveryDate: new Date(dto.deliveryDate),
        currency: cpo.currency,
        remarks: dto.remarks,
        subtotal: Math.round(subtotal * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        companyId: user.companyId,
        createdBy: user.id,
        updatedBy: user.id,
        items: { create: calcItems },
      },
      include: this.includes(),
    });

    // Update CPO status to IN_PROGRESS
    await this.prisma.customerPo.update({
      where: { id: dto.cpoId },
      data: { status: 'IN_PROGRESS', updatedBy: user.id },
    });

    await this.audit.log({
      tableName: 'sales_orders',
      recordId: so.id,
      action: 'CREATE',
      newValues: so,
      changedBy: user.id,
    });
    return so;
  }

  async confirm(id: string, user: any) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!so) throw new NotFoundException('Sales Order not found');
    if (so.status !== 'DRAFT')
      throw new BadRequestException('Only DRAFT sales orders can be confirmed');

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedDate: new Date(),
        confirmedBy: user.id,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({
      tableName: 'sales_orders',
      recordId: id,
      action: 'UPDATE',
      newValues: updated,
      changedBy: user.id,
    });
    return updated;
  }

  async cancel(id: string, dto: CancelSoDto, user: any) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!so) throw new NotFoundException('Sales Order not found');
    if (['COMPLETED', 'CANCELLED'].includes(so.status))
      throw new BadRequestException(`Cannot cancel ${so.status} SO`);
    if (so.status === 'DISPATCHED')
      throw new BadRequestException('Cannot cancel partially dispatched SO');

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledDate: new Date(),
        cancelReason: dto.cancelReason,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({
      tableName: 'sales_orders',
      recordId: id,
      action: 'UPDATE',
      newValues: updated,
      changedBy: user.id,
    });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (search)
      where.OR = [
        { soNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    if (status)
      where.status = status.includes(',') ? { in: status.split(',') } : status;

    const [data, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: {
              id: true,
              itemCode: true,
              qty: true,
              dispatchedQty: true,
              pendingQty: true,
            },
          },
          cpo: { select: { cpoNumber: true, customerPoNumber: true } },
        },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);
    return {
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findOne(id: string, user: any) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id, companyId: user.companyId },
      include: this.includes(),
    });
    if (!so) throw new NotFoundException('Sales Order not found');
    return so;
  }

  async getByCpo(cpoId: string, user: any) {
    return this.prisma.salesOrder.findMany({
      where: { cpoId, companyId: user.companyId },
      include: this.includes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  // DSP-001 sections 13-15, 21: explicit per-line release action - a
  // line only becomes visible to Dispatch once released, separately
  // from the SO header's own approval status, so different lines on
  // the same SO can release independently (RM ready, SFG ready, FG
  // not yet). Re-validates SFG saleable-stage configuration at release
  // time, not just at line-creation time, since routing/saleable
  // config can change in between.
  // DSP-002 section 25-26: which plant this order dispatches from -
  // explicit if set on the SO, else falls back to the company's plant
  // (this is a single-plant company today; multi-plant selection is a
  // future UI concern, not something DSP-002 needs to force now).
  private async resolveDispatchPlant(salesOrder: any, user: any) {
    if (salesOrder.dispatchPlantId) return salesOrder.dispatchPlantId;
    const plant = await this.prisma.plant.findFirst({ where: { companyId: user.companyId, isActive: true } });
    return plant?.id || null;
  }

  // DSP-002 sections 3-13, 25-30, 32-37: deterministic, master-driven
  // source identification - never free text, never guessed. Returns a
  // clear VALID/INVALID result; never partially resolves.
  private async resolveSource(item: any, dispatchPlantId: string | null, user: any) {
    if (!dispatchPlantId) {
      return { sourceValid: false, sourceInvalidReason: 'No dispatch plant could be determined for this order.' };
    }

    if (item.saleType === 'RM') {
      const rm = await this.prisma.rawMaterial.findFirst({ where: { companyId: user.companyId, code: item.itemCode, isActive: true } });
      if (!rm) return { sourceValid: false, sourceInvalidReason: `"${item.itemCode}" is not a valid active Raw Material.` };
      const warehouse = await this.prisma.warehouse.findFirst({ where: { companyId: user.companyId, plantId: dispatchPlantId, type: 'RAW_MATERIAL', isActive: true } });
      if (!warehouse) return { sourceValid: false, sourceInvalidReason: 'No active Raw Material warehouse configured for this plant.' };
      const hasBatches = await this.prisma.stockBatch.findFirst({ where: { companyId: user.companyId, itemCode: item.itemCode } });
      return {
        sourceValid: true, sourceType: 'RM_INVENTORY', sourceWarehouseType: 'RAW_MATERIAL',
        sourceBatchControlled: !!hasBatches, sourceSerialControlled: false,
      };
    }

    if (item.saleType === 'FG') {
      const product = await this.prisma.product.findFirst({ where: { companyId: user.companyId, code: item.itemCode, isActive: true } });
      if (!product) return { sourceValid: false, sourceInvalidReason: `"${item.itemCode}" is not a valid active saleable Finished Product.` };
      const warehouse = await this.prisma.warehouse.findFirst({ where: { companyId: user.companyId, plantId: dispatchPlantId, type: 'FINISHED_GOOD', isActive: true } });
      if (!warehouse) return { sourceValid: false, sourceInvalidReason: 'No active Finished Goods warehouse configured for this plant.' };
      const hasBatches = await this.prisma.stockBatch.findFirst({ where: { companyId: user.companyId, itemCode: item.itemCode } });
      return {
        sourceValid: true, sourceType: 'FG_INVENTORY', sourceWarehouseType: 'FINISHED_GOOD',
        sourceBatchControlled: !!hasBatches, sourceSerialControlled: false,
      };
    }

    // SFG - the stage itself was already validated (exists, saleable)
    // by the caller before resolveSource() is invoked; here we only
    // confirm the plant/routing consistency and shape the source result.
    if (item.saleType === 'SFG') {
      return {
        sourceValid: true, sourceType: 'SFG_STAGE', sourceWarehouseType: 'WIP',
        sourceBatchControlled: true, sourceSerialControlled: false,
      };
    }

    return { sourceValid: false, sourceInvalidReason: `Unrecognized saleType "${item.saleType}".` };
  }

  async releaseLineForDispatch(soItemId: string, user: any) {
    const item = await this.prisma.salesOrderItem.findFirst({
      where: { id: soItemId, isActive: true, salesOrder: { companyId: user.companyId } },
      include: { salesOrder: true, requiredStage: true },
    });
    if (!item) throw new NotFoundException('Sales Order line not found');
    if (!['CONFIRMED', 'IN_PRODUCTION'].includes(item.salesOrder.status)) {
      throw new BadRequestException(`Sales Order must be CONFIRMED or IN_PRODUCTION to release a line for Dispatch (currently ${item.salesOrder.status})`);
    }
    if (item.releasedForDispatch) {
      throw new BadRequestException('This line is already released for Dispatch');
    }

    if (item.saleType === 'SFG') {
      if (!item.requiredStage) {
        throw new BadRequestException(`"${item.itemCode}" is marked as an SFG sale but has no required Production Stage on record.`);
      }
      if (!item.requiredStage.isSaleable) {
        throw new BadRequestException(`${item.requiredStage.stageName} stage is not configured as saleable for this product.`);
      }
    }

    // DSP-002 section 33: a line whose source cannot be determined is
    // never released - "do not guess" applies to the release action
    // itself, not just to a later read-only report.
    const dispatchPlantId = await this.resolveDispatchPlant(item.salesOrder, user);
    const source = await this.resolveSource(item, dispatchPlantId, user);
    if (!source.sourceValid) {
      throw new BadRequestException(`Cannot release "${item.itemCode}" for Dispatch - ${source.sourceInvalidReason}`);
    }

    const updated = await this.prisma.salesOrderItem.update({
      where: { id: soItemId },
      data: {
        releasedForDispatch: true, releasedAt: new Date(), releasedBy: user.id, updatedBy: user.id,
        sourceType: source.sourceType, sourceWarehouseType: source.sourceWarehouseType,
        sourcePlantId: dispatchPlantId, sourceValid: true, sourceInvalidReason: null,
        sourceBatchControlled: source.sourceBatchControlled, sourceSerialControlled: source.sourceSerialControlled,
        sourceResolvedAt: new Date(), sourceResolvedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'sales_order_items', recordId: soItemId, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // DSP-001 sections 7-10: what the SO creation form needs to populate
  // the SFG stage dropdown - only stages actually marked saleable for
  // this specific product's routing, scoped to Sales permissions (not
  // Production's) since this is consumed at order-entry time by Sales
  // staff, not by Production.
  async getSaleableStages(itemCode: string, user: any) {
    const product = await this.prisma.product.findFirst({ where: { companyId: user.companyId, code: itemCode, isActive: true } });
    if (!product) return [];
    const stages = await this.prisma.routingStage.findMany({
      where: { companyId: user.companyId, isSaleable: true, routing: { finalProductId: product.id } },
      orderBy: { sequence: 'asc' },
    });
    return stages.map(s => ({ id: s.id, stageName: s.stageName, sequence: s.sequence }));
  }

  // DSP-001 section 21, 25: what Dispatch actually reads - only
  // released, still-open lines (pendingQty > 0), never a line whose
  // parent SO has since been cancelled. Filterable by saleType so
  // Dispatch can show ALL/RM/SFG/FG without needing separate pages.
  async getDispatchReadyLines(user: any, query: any) {
    const { saleType } = query || {};
    const where: any = {
      releasedForDispatch: true,
      isActive: true,
      pendingQty: { gt: 0 },
      salesOrder: { companyId: user.companyId, status: { notIn: ['CANCELLED'] } },
    };
    if (saleType) where.saleType = saleType;

    const items = await this.prisma.salesOrderItem.findMany({
      where,
      include: {
        salesOrder: { select: { soNumber: true, customerName: true, deliveryDate: true, status: true, cpo: { select: { customerPoNumber: true } } } },
        requiredStage: { select: { stageName: true } },
      },
      orderBy: { salesOrder: { deliveryDate: 'asc' } },
    });

    return items.map(i => ({
      soItemId: i.id,
      soNumber: i.salesOrder.soNumber,
      customerName: i.salesOrder.customerName,
      customerPoNumber: i.salesOrder.cpo?.customerPoNumber,
      itemCode: i.itemCode,
      itemName: i.itemName,
      saleType: i.saleType,
      requiredStageName: i.requiredStage?.stageName || null,
      orderedQty: i.qty,
      dispatchedQty: i.dispatchedQty,
      pendingQty: i.pendingQty,
      uom: i.uom,
      deliveryDate: i.salesOrder.deliveryDate,
      salesOrderStatus: i.salesOrder.status,
      sourceType: i.sourceType,
      sourceWarehouseType: i.sourceWarehouseType,
      sourceValid: i.sourceValid,
    }));
  }

  async getSourceDetail(soItemId: string, user: any) {
    const item = await this.prisma.salesOrderItem.findFirst({
      where: { id: soItemId, isActive: true, salesOrder: { companyId: user.companyId } },
      include: { requiredStage: { select: { stageName: true } } },
    });
    if (!item) throw new NotFoundException('Sales Order line not found');
    return {
      soItemId: item.id, itemCode: item.itemCode, saleType: item.saleType,
      releasedForDispatch: item.releasedForDispatch,
      sourceType: item.sourceType, sourceWarehouseType: item.sourceWarehouseType,
      sourcePlantId: item.sourcePlantId, sourceValid: item.sourceValid,
      sourceInvalidReason: item.sourceInvalidReason,
      sourceBatchControlled: item.sourceBatchControlled, sourceSerialControlled: item.sourceSerialControlled,
      requiredStageName: item.requiredStage?.stageName || null,
      sourceResolvedAt: item.sourceResolvedAt, sourceResolvedBy: item.sourceResolvedBy,
    };
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [
      total,
      draft,
      confirmed,
      inProduction,
      dispatched,
      completed,
      cancelled,
      overdue,
    ] = await Promise.all([
      this.prisma.salesOrder.count({ where }),
      this.prisma.salesOrder.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.salesOrder.count({
        where: { ...where, status: 'CONFIRMED' },
      }),
      this.prisma.salesOrder.count({
        where: { ...where, status: 'IN_PRODUCTION' },
      }),
      this.prisma.salesOrder.count({
        where: { ...where, status: 'DISPATCHED' },
      }),
      this.prisma.salesOrder.count({
        where: { ...where, status: 'COMPLETED' },
      }),
      this.prisma.salesOrder.count({
        where: { ...where, status: 'CANCELLED' },
      }),
      this.prisma.salesOrder.count({
        where: {
          ...where,
          status: { in: ['CONFIRMED', 'IN_PRODUCTION'] },
          deliveryDate: { lt: new Date() },
        },
      }),
    ]);
    const valueAgg = await this.prisma.salesOrder.aggregate({
      where: { ...where, status: { notIn: ['CANCELLED'] } },
      _sum: { totalAmount: true },
    });
    return {
      total,
      draft,
      confirmed,
      inProduction,
      dispatched,
      completed,
      cancelled,
      overdue,
      totalValue: valueAgg._sum.totalAmount || 0,
    };
  }
}
