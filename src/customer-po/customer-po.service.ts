import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCpoDto, UpdateCpoDto, CancelCpoDto, CreateQuantityIncreaseDto } from './dto/customer-po.dto';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { MrpService } from '../mrp/mrp.service';

@Injectable()
export class CustomerPoService {
  constructor(private prisma: PrismaService, private audit: AuditService, private salesOrders: SalesOrdersService, private mrpService: MrpService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.customerPo.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `CPO-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateTaskNumber(companyId: string): Promise<string> {
    const count = await this.prisma.task.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `TSK-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private calcItem(item: any) {
    const qty = item.qty || 0;
    const unitPrice = item.unitPrice || 0;
    const discount = item.discount || 0;
    const gstRate = item.gstRate ?? 18;
    const gross = qty * unitPrice;
    const discAmt = Math.round(gross * discount / 100 * 100) / 100;
    const taxableAmt = Math.round((gross - discAmt) * 100) / 100;
    const gstAmount = Math.round(taxableAmt * gstRate / 100 * 100) / 100;
    const totalAmount = Math.round((taxableAmt + gstAmount) * 100) / 100;
    return { taxableAmt, gstAmount, totalAmount, pendingQty: qty };
  }

  private includes() {
    return {
      items: true,
      quotation: { select: { quotationNumber: true, revision: true, totalAmount: true } },
      amendmentOf: { select: { id: true, cpoNumber: true, customerPoNumber: true } },
      amendmentChildren: { select: { id: true, cpoNumber: true, status: true, totalAmount: true, createdAt: true } },
    };
  }

  async create(dto: CreateCpoDto, user: any) {
    if (dto.quotationId) {
      const qt = await this.prisma.quotation.findFirst({ where: { id: dto.quotationId, companyId: user.companyId } });
      if (!qt) throw new NotFoundException('Quotation not found');
      if (qt.status !== 'ACCEPTED') throw new BadRequestException('Quotation must be ACCEPTED to create CPO');
    }

    const cpoNumber = await this.generateNumber(user.companyId);

    const customerPoNumber = dto.poType === 'VERBAL'
      ? `VERBAL-${cpoNumber}`
      : dto.customerPoNumber;

    if (dto.poType === 'WRITTEN' && !dto.customerPoNumber) {
      throw new BadRequestException('customerPoNumber is required for WRITTEN orders');
    }
    if (dto.poType === 'VERBAL' && !dto.verbalConfirmedBy) {
      throw new BadRequestException('verbalConfirmedBy is required for VERBAL orders');
    }

    const calcItems = dto.items.map(item => ({
      itemCode: item.itemCode, itemName: item.itemName, description: item.description,
      qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice,
      discount: item.discount || 0, gstRate: item.gstRate ?? 18,
      ...this.calcItem(item),
      createdBy: user.id, updatedBy: user.id,
    }));

    const subtotal = calcItems.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    const totalGst = calcItems.reduce((s, i) => s + i.gstAmount, 0);
    const totalAmount = calcItems.reduce((s, i) => s + i.totalAmount, 0);

    const cpo = await this.prisma.customerPo.create({
      data: {
        cpoNumber,
        customerPoNumber,
        poType: dto.poType,
        verbalConfirmedBy: dto.poType === 'VERBAL' ? dto.verbalConfirmedBy : null,
        verbalConfirmedDate: dto.poType === 'VERBAL' && dto.verbalConfirmedDate ? new Date(dto.verbalConfirmedDate) : null,
        quotationId: dto.quotationId,
        customerName: dto.customerName, customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone, deliveryAddress: dto.deliveryAddress,
        poDate: new Date(dto.poDate), deliveryDate: new Date(dto.deliveryDate),
        currency: dto.currency || 'INR', remarks: dto.remarks,
        subtotal: Math.round(subtotal * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: { create: calcItems },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'customer_pos', recordId: cpo.id, action: 'CREATE', newValues: cpo, changedBy: user.id });

    // Automatically run the shortage check right after creation - no
    // manual trigger needed. If this fails for any reason, don't block
    // the PO from being created; the check can still be re-run manually
    // via the API later if needed.
    try {
      await this.runShortageCheck(cpo.id, user);
    } catch (e) {
      // swallow - PO creation should still succeed even if the shortage
      // check has an issue (e.g. transient DB error); it can be re-run.
    }

    return cpo;
  }

  /**
   * Acknowledging a CPO now also automatically creates its linked Sales
   * Order in the same database transaction - if SO creation fails for
   * any reason, the acknowledgment itself rolls back too, so a CPO can
   * never end up ACKNOWLEDGED without a corresponding SO.
   */
  async acknowledge(id: string, user: any) {
    const existing = await this.prisma.customerPo.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('CPO not found');
    if (existing.status !== 'RECEIVED') throw new BadRequestException('Only RECEIVED CPOs can be acknowledged');

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.customerPo.update({
        where: { id },
        data: { status: 'ACKNOWLEDGED', acknowledgedDate: new Date(), updatedBy: user.id },
        include: this.includes(),
      });

      const so = await this.salesOrders.createFromCpo(updated, existing.items, user, tx);

      return { cpo: updated, salesOrder: so };
    });

    await this.audit.log({ tableName: 'customer_pos', recordId: id, action: 'UPDATE', newValues: result.cpo, changedBy: user.id });
    return result.cpo;
  }

  /**
   * Edit is only allowed while status is RECEIVED (before Acknowledge).
   * Once acknowledged, cancelled, or completed, the PO is locked and
   * must be cancelled + recreated if something needs to change.
   * Items are fully replaced (not merged) since the frontend always
   * resubmits the complete item list. If quantities changed, the
   * shortage check is automatically re-run afterward so Purchase
   * always sees numbers that reflect the current order.
   */
  async update(id: string, dto: UpdateCpoDto, user: any) {
    const existing = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new NotFoundException('CPO not found');
    if (existing.status !== 'RECEIVED') {
      throw new BadRequestException(`Cannot edit a CPO once it is ${existing.status}. Cancel and create a new one instead.`);
    }

    const customerPoNumber = dto.poType === 'VERBAL'
      ? existing.customerPoNumber.startsWith('VERBAL-') ? existing.customerPoNumber : `VERBAL-${existing.cpoNumber}`
      : dto.customerPoNumber;

    if (dto.poType === 'WRITTEN' && !dto.customerPoNumber) {
      throw new BadRequestException('customerPoNumber is required for WRITTEN orders');
    }
    if (dto.poType === 'VERBAL' && !dto.verbalConfirmedBy) {
      throw new BadRequestException('verbalConfirmedBy is required for VERBAL orders');
    }

    const calcItems = dto.items.map(item => ({
      itemCode: item.itemCode, itemName: item.itemName, description: item.description,
      qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice,
      discount: item.discount || 0, gstRate: item.gstRate ?? 18,
      ...this.calcItem(item),
      createdBy: user.id, updatedBy: user.id,
    }));

    const subtotal = calcItems.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    const totalGst = calcItems.reduce((s, i) => s + i.gstAmount, 0);
    const totalAmount = calcItems.reduce((s, i) => s + i.totalAmount, 0);

    // Full replace of items - delete existing, insert the resubmitted set.
    await this.prisma.customerPoItem.deleteMany({ where: { cpoId: id } });

    const updated = await this.prisma.customerPo.update({
      where: { id },
      data: {
        customerPoNumber,
        poType: dto.poType,
        verbalConfirmedBy: dto.poType === 'VERBAL' ? dto.verbalConfirmedBy : null,
        verbalConfirmedDate: dto.poType === 'VERBAL' && dto.verbalConfirmedDate ? new Date(dto.verbalConfirmedDate) : null,
        quotationId: dto.quotationId,
        customerName: dto.customerName, customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone, deliveryAddress: dto.deliveryAddress,
        poDate: new Date(dto.poDate), deliveryDate: new Date(dto.deliveryDate),
        currency: dto.currency || 'INR', remarks: dto.remarks,
        subtotal: Math.round(subtotal * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        updatedBy: user.id,
        items: { create: calcItems },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'customer_pos', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });

    // Items may have changed (e.g. increased quantity) - re-run the
    // shortage check so stock requirements reflect the current order.
    try {
      await this.runShortageCheck(id, user);
    } catch (e) {
      // swallow - edit should still succeed even if the shortage check
      // has an issue; it can be re-run.
    }

    return updated;
  }

  /**
   * When a customer wants to increase quantity on a PO that's already
   * been acknowledged (locked from direct editing), this creates a
   * brand-new Customer PO for just the extra quantity - reusing
   * create() in full, so it gets its own number, its own automatic
   * shortage check, and goes through the exact same lifecycle as any
   * other PO. It's linked back to the original via amendmentOfId so
   * the relationship is traceable, but the system otherwise treats it
   * as a completely normal, independent PO from this point on.
   */
  async createQuantityIncrease(originalId: string, dto: CreateQuantityIncreaseDto, user: any) {
    const original = await this.prisma.customerPo.findFirst({ where: { id: originalId, companyId: user.companyId } });
    if (!original) throw new NotFoundException('Original CPO not found');
    if (original.status === 'RECEIVED') {
      throw new BadRequestException('This PO has not been acknowledged yet - use Edit instead of Increase Quantity.');
    }
    if (original.status === 'CANCELLED') {
      throw new BadRequestException('Cannot increase quantity on a cancelled PO.');
    }

    const note = `Quantity increase against PO ${original.cpoNumber} (Customer PO: ${original.customerPoNumber}).${dto.remarks ? ' ' + dto.remarks : ''}`;

    const createDto: CreateCpoDto = {
      poType: dto.poType,
      customerPoNumber: dto.poType === 'WRITTEN' ? dto.customerPoNumber : undefined,
      verbalConfirmedBy: dto.poType === 'VERBAL' ? dto.verbalConfirmedBy : undefined,
      verbalConfirmedDate: dto.poType === 'VERBAL' ? dto.verbalConfirmedDate : undefined,
      quotationId: undefined,
      customerName: original.customerName,
      customerEmail: original.customerEmail || undefined,
      customerPhone: original.customerPhone || undefined,
      deliveryAddress: original.deliveryAddress || undefined,
      poDate: new Date().toISOString(),
      deliveryDate: dto.deliveryDate,
      currency: original.currency,
      remarks: note,
      items: dto.items,
    } as any;

    const newCpo = await this.create(createDto, user);

    const linked = await this.prisma.customerPo.update({
      where: { id: newCpo.id },
      data: { amendmentOfId: original.id },
      include: this.includes(),
    });

    return linked;
  }

  async cancel(id: string, dto: CancelCpoDto, user: any) {
    const cpo = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId } });
    if (!cpo) throw new NotFoundException('CPO not found');
    if (['COMPLETED', 'CANCELLED'].includes(cpo.status)) throw new BadRequestException(`Cannot cancel ${cpo.status} CPO`);

    const updated = await this.prisma.customerPo.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledDate: new Date(), cancelReason: dto.cancelReason, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'customer_pos', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });

    try {
      await this.recheckAllOpenPos(user.companyId, user.id);
    } catch (e) {
      // swallow - cancellation should still succeed even if the recheck sweep has an issue
    }

    return updated;
  }

  /**
   * Re-runs the shortage check for every currently open Customer PO in
   * the company. Called automatically whenever something changes that
   * could affect FIFO stock allocation across orders: a PO gets
   * cancelled (freeing its claim), or new stock arrives via the stock
   * ledger (postTransaction in stock-ledger.service.ts calls this after
   * any inward stock movement). triggeredByUserId is used only for
   * audit attribution on the resulting shortage-check records.
   */
  async recheckAllOpenPos(companyId: string, triggeredByUserId: string) {
    const pseudoUser = { companyId, id: triggeredByUserId };
    const openCpos = await this.prisma.customerPo.findMany({
      where: { companyId, status: { in: ['RECEIVED', 'ACKNOWLEDGED', 'IN_PROGRESS'] } },
      select: { id: true },
    });

    const results: Array<{ cpoId: string; ok: boolean; error?: string }> = [];
    for (const cpo of openCpos) {
      try {
        await this.runShortageCheck(cpo.id, pseudoUser);
        results.push({ cpoId: cpo.id, ok: true });
      } catch (e: any) {
        results.push({ cpoId: cpo.id, ok: false, error: e?.message });
      }
    }
    return results;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, poType } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (search) where.OR = [
      { cpoNumber: { contains: search, mode: 'insensitive' } },
      { customerPoNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (poType) where.poType = poType;

    const [data, total] = await Promise.all([
      this.prisma.customerPo.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { items: { select: { id: true, itemCode: true, qty: true, deliveredQty: true, pendingQty: true } }, quotation: { select: { quotationNumber: true } } },
      }),
      this.prisma.customerPo.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const cpo = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!cpo) throw new NotFoundException('CPO not found');
    return cpo;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, received, acknowledged, inProgress, completed, cancelled, written, verbal] = await Promise.all([
      this.prisma.customerPo.count({ where }),
      this.prisma.customerPo.count({ where: { ...where, status: 'RECEIVED' } }),
      this.prisma.customerPo.count({ where: { ...where, status: 'ACKNOWLEDGED' } }),
      this.prisma.customerPo.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.customerPo.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.customerPo.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.customerPo.count({ where: { ...where, poType: 'WRITTEN' } }),
      this.prisma.customerPo.count({ where: { ...where, poType: 'VERBAL' } }),
    ]);
    const valueAgg = await this.prisma.customerPo.aggregate({
      where: { ...where, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true },
    });
    const overdueCount = await this.prisma.customerPo.count({
      where: { ...where, status: { in: ['ACKNOWLEDGED', 'IN_PROGRESS'] }, deliveryDate: { lt: new Date() } },
    });
    return { total, received, acknowledged, inProgress, completed, cancelled, written, verbal, overdueCount, totalOrderValue: valueAgg._sum.totalAmount || 0 };
  }

  /**
   * Shortage check logic, per business rule:
   * 1. If the sold item is a Product WITH an approved BOM (either its own
   *    MASTER BOM, or - for an intermediate routing-stage item ordered
   *    directly, like an SMT board or an MI assembly - the STAGE BOM off
   *    its RoutingStage) -> recursively explode the full BOM/routing tree
   *    down to true raw materials, checking each one's stock. An
   *    intermediate item that already has enough of its own finished
   *    stock never has its own raw materials checked at all - only a
   *    genuine shortfall recurses further.
   * 2. If the sold item is a Product with NO approved BOM anywhere in its
   *    tree -> do not attempt any stock check. Auto-create a Task
   *    flagging that a BOM needs to be created for this product, linked
   *    back to this CPO.
   * 3. If the sold item IS a raw material itself (no Product master
   *    matches, but a RawMaterial does) -> skip BOM entirely, check that
   *    raw material's own stock directly against the ordered quantity.
   * 4. If neither a Product nor a RawMaterial matches the item code ->
   *    flag as unknown/unmapped item code.
   *
   * Stock allocation is FIFO across ALL open Customer POs (not just this
   * one) that need the same item - at EVERY level of the BOM/routing
   * tree, not just the top one - whichever PO was created first gets
   * first claim on available stock; later POs see only what's left.
   * Without this, two POs needing the same limited material would each
   * independently see the same "available" stock and both report a
   * smaller shortage than the true combined shortfall. Only RECEIVED,
   * ACKNOWLEDGED, and IN_PROGRESS POs compete for stock this way -
   * CANCELLED POs make no claim, and COMPLETED POs are assumed to have
   * already had their material physically issued (already reflected in
   * the live stock balance), so including them again here would
   * double-count their consumption.
   */
  async runShortageCheck(cpoId: string, user: any) {
    const companyId = user.companyId;
    const cpo = await this.prisma.customerPo.findFirst({
      where: { id: cpoId, companyId },
      include: { items: { where: { isActive: true } } },
    });
    if (!cpo) throw new NotFoundException('CPO not found');
    if (['CANCELLED'].includes(cpo.status)) {
      throw new BadRequestException('Cannot run shortage check on a cancelled CPO');
    }
    await this.prisma.materialShortage.deleteMany({
      where: { companyId, customerPoId: cpoId, status: 'OPEN' },
    });

    const openCpos = await this.prisma.customerPo.findMany({
      where: { companyId, status: { in: ['RECEIVED', 'ACKNOWLEDGED', 'IN_PROGRESS'] } },
      include: { items: { where: { isActive: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const bucketOrder = openCpos.map(c => c.id);

    // One level-0 demand bucket per (open CPO, sellable line item) -
    // shared across ALL open CPOs so the engine can FIFO-allocate the
    // same limited stock pool fairly, oldest order first, at every level
    // of the BOM/routing tree, not just the top one. Items matching
    // neither a Product nor a RawMaterial master contribute no demand
    // here and are reported as NO_PRODUCT_MASTER below instead.
    const buckets: { bucketKey: string; itemCode: string; itemName: string; uom: string; qty: number }[] = [];
    for (const otherCpo of openCpos) {
      for (const item of otherCpo.items) {
        const product = await this.prisma.product.findFirst({ where: { companyId, code: item.itemCode } });
        const rawMaterial = product ? null : await this.prisma.rawMaterial.findFirst({ where: { companyId, code: item.itemCode } });
        if (!product && !rawMaterial) continue;
        buckets.push({ bucketKey: otherCpo.id, itemCode: item.itemCode, itemName: item.itemName, uom: item.uom, qty: item.qty });
      }
    }

    const { levelZero, leafShortages, leavesOf } = await this.mrpService.explodeMultiCpoMaterialNeeds(companyId, buckets, bucketOrder);
    const cpoLevelZero = levelZero.get(cpoId) || new Map();
    const cpoLeafShortages = leafShortages.get(cpoId) || [];

    const shortageRows: any[] = [];
    const itemResults: any[] = [];
    const bomTasksCreated: string[] = [];
    let hasShortage = false;

    for (const cpoItem of cpo.items) {
      const product = await this.prisma.product.findFirst({ where: { companyId, code: cpoItem.itemCode } });

      if (product) {
        const lz = cpoLevelZero.get(cpoItem.itemCode);
        const fgAvailableQty = lz?.availableQty ?? 0;
        const fgAllocatedQty = lz?.allocatedQty ?? 0;
        const netProductionQty = lz ? lz.netQty : cpoItem.qty;

        if (netProductionQty <= 0) {
          itemResults.push({
            itemCode: cpoItem.itemCode, itemName: cpoItem.itemName,
            status: 'AVAILABLE_FROM_FG_STOCK',
            message: `Fully covered by existing finished goods stock (${fgAllocatedQty} ${cpoItem.uom} allocated). No production required.`,
            requiredQty: cpoItem.qty, fgAvailableQty, fgAllocatedQty,
          });
          continue;
        }

        if (!lz?.hasBom) {
          const taskNumber = await this.generateTaskNumber(companyId);
          const task = await this.prisma.task.create({
            data: {
              companyId,
              taskNumber,
              title: `Create BOM for product ${cpoItem.itemCode} (${cpoItem.itemName})`,
              description: `Customer PO ${cpo.cpoNumber} ordered "${cpoItem.itemName}" (${cpoItem.qty} ${cpoItem.uom}) but no approved BOM exists for this product. A BOM must be created before a material shortage check can be run for this item.${fgAllocatedQty > 0 ? ` Note: ${fgAllocatedQty} ${cpoItem.uom} is already covered by existing finished goods stock; only the remaining ${netProductionQty} ${cpoItem.uom} needs production.` : ''}`,
              assignedTo: user.id,
              assignedBy: user.id,
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              priority: 'HIGH',
              category: 'BOM_CREATION',
              referenceType: 'CustomerPo',
              referenceId: cpoId,
              referenceNumber: cpo.cpoNumber,
              createdBy: user.id,
              updatedBy: user.id,
            },
          });
          bomTasksCreated.push(task.taskNumber);
          itemResults.push({
            itemCode: cpoItem.itemCode, itemName: cpoItem.itemName,
            status: 'BOM_MISSING',
            message: `No approved BOM found. Task ${task.taskNumber} created to request BOM creation.`,
            taskNumber: task.taskNumber,
            fgAvailableQty, fgAllocatedQty, netProductionQty,
          });
          continue;
        }

        const masterBom = await this.prisma.bom.findFirst({
          where: { companyId, productId: product.id, status: 'APPROVED', bomType: 'MASTER' },
        });
        const stageBom = masterBom ? null : (await this.prisma.routingStage.findFirst({
          where: { companyId, isActive: true, bom: { productId: product.id, status: 'APPROVED' } },
          include: { bom: true, routing: true },
        }))?.bom;
        const bomNumber = masterBom?.bomNumber || stageBom?.bomNumber || null;

        // Fully-exploded, true-leaf-level components - an intermediate
        // stage's own output (SMT board, MI assembly, etc.) only shows up
        // here if IT genuinely lacks stock; otherwise it's invisible, and
        // its own raw materials never needed to be checked at all.
        const reachableLeaves = leavesOf.get(cpoItem.itemCode) || new Set<string>();
        const componentResults = cpoLeafShortages
          .filter(s => reachableLeaves.has(s.itemCode))
          .map(s => ({
            itemCode: s.itemCode, itemName: s.itemName, uom: s.uom,
            netRequired: s.netRequired, availableQty: s.availableQty,
            shortage: s.shortage, status: 'SHORTAGE',
          }));

        for (const c of componentResults) {
          hasShortage = true;
          shortageRows.push({
            companyId,
            customerPoId: cpoId,
            rawMaterialId: cpoLeafShortages.find(s => s.itemCode === c.itemCode)?.rawMaterialId || null,
            itemCode: c.itemCode,
            itemName: c.itemName,
            requiredQty: c.netRequired,
            availableQty: c.availableQty,
            shortageQty: c.shortage,
            uom: c.uom,
            status: 'OPEN',
            createdBy: user.id,
            updatedBy: user.id,
          });
        }

        itemResults.push({
          itemCode: cpoItem.itemCode, itemName: cpoItem.itemName,
          status: 'CHECKED', bomNumber, components: componentResults,
          fgAvailableQty, fgAllocatedQty, netProductionQty,
          message: fgAllocatedQty > 0 ? `${fgAllocatedQty} ${cpoItem.uom} covered by finished goods stock; ${netProductionQty} ${cpoItem.uom} requires production.` : undefined,
        });
        continue;
      }

      const rawMaterial = await this.prisma.rawMaterial.findFirst({
        where: { companyId, code: cpoItem.itemCode },
      });
      if (rawMaterial) {
        const leaf = cpoLeafShortages.find(s => s.itemCode === cpoItem.itemCode);
        const lz = cpoLevelZero.get(cpoItem.itemCode);
        const availableQty = lz?.availableQty ?? 0;
        const shortage = leaf?.shortage ?? 0;
        if (shortage > 0) {
          hasShortage = true;
          shortageRows.push({
            companyId,
            customerPoId: cpoId,
            rawMaterialId: rawMaterial.id,
            itemCode: cpoItem.itemCode,
            itemName: cpoItem.itemName,
            requiredQty: cpoItem.qty,
            availableQty,
            shortageQty: Math.round(shortage * 1000) / 1000,
            uom: cpoItem.uom,
            status: 'OPEN',
            createdBy: user.id,
            updatedBy: user.id,
          });
        }
        itemResults.push({
          itemCode: cpoItem.itemCode, itemName: cpoItem.itemName,
          status: 'CHECKED_DIRECT_STOCK',
          message: 'Item is a raw material sold directly - checked store stock, no BOM applicable.',
          availableQty, requiredQty: cpoItem.qty, shortage: Math.round(shortage * 1000) / 1000,
        });
        continue;
      }
      itemResults.push({
        itemCode: cpoItem.itemCode, itemName: cpoItem.itemName,
        status: 'NO_PRODUCT_MASTER',
        message: 'No matching Product or Raw Material master found for this item code.',
      });
    }
    if (shortageRows.length > 0) {
      await this.prisma.materialShortage.createMany({ data: shortageRows });
    }
    const updated = await this.prisma.customerPo.update({
      where: { id: cpoId },
      data: {
        mrpRunAt: new Date(),
        mrpRunBy: user.id,
        lastShortageCheckResult: itemResults,
        updatedBy: user.id,
      },
    });
    await this.audit.log({
      tableName: 'customer_pos', recordId: cpoId, action: 'UPDATE',
      newValues: { mrpRunAt: updated.mrpRunAt, shortageCount: shortageRows.length, bomTasksCreated },
      changedBy: user.id,
    });
    return {
      cpoNumber: cpo.cpoNumber,
      itemResults,
      summary: {
        totalItems: cpo.items.length,
        itemsChecked: itemResults.filter(i => i.status === 'CHECKED' || i.status === 'CHECKED_DIRECT_STOCK').length,
        itemsAvailableFromFgStock: itemResults.filter(i => i.status === 'AVAILABLE_FROM_FG_STOCK').length,
        itemsMissingBom: itemResults.filter(i => i.status === 'BOM_MISSING').length,
        itemsMissingProduct: itemResults.filter(i => i.status === 'NO_PRODUCT_MASTER').length,
        shortageCount: shortageRows.length,
        bomTasksCreated,
        hasShortage,
        canFulfillFromStock: !hasShortage,
      },
    };
  }


  /**
   * Aggregated view for Purchase: every OPEN material shortage across
   * every Customer PO, grouped by item so Purchase sees "I need to buy
   * X total of item Y" in one place, rather than checking each order
   * individually. Each item also lists exactly which orders are driving
   * that demand, so Purchase can trace it back if needed.
   */
  async getAllOpenShortages(user: any) {
    const companyId = user.companyId;
    const shortages = await this.prisma.materialShortage.findMany({
      where: { companyId, status: 'OPEN' },
      include: { customerPo: { select: { cpoNumber: true, customerName: true, deliveryDate: true } } },
      orderBy: { itemCode: 'asc' },
    });

    const grouped = new Map<string, { itemCode: string; itemName: string; uom: string; totalShortageQty: number; affectedOrders: any[] }>();
    for (const s of shortages) {
      if (!grouped.has(s.itemCode)) {
        grouped.set(s.itemCode, { itemCode: s.itemCode, itemName: s.itemName, uom: s.uom, totalShortageQty: 0, affectedOrders: [] });
      }
      const g = grouped.get(s.itemCode)!;
      g.totalShortageQty = Math.round((g.totalShortageQty + s.shortageQty) * 1000) / 1000;
      g.affectedOrders.push({
        shortageId: s.id,
        cpoNumber: s.customerPo.cpoNumber,
        customerName: s.customerPo.customerName,
        deliveryDate: s.customerPo.deliveryDate,
        shortageQty: s.shortageQty,
      });
    }

    const data = Array.from(grouped.values()).sort((a, b) => b.totalShortageQty - a.totalShortageQty);
    return {
      data,
      totalItemsShort: data.length,
      totalShortageRecords: shortages.length,
    };
  }

  // Marks all OPEN shortage records for the given item codes as PR_RAISED,
  // linking them to the PO just created from the shortage screen - closes
  // the loop so Purchase can trace which PO covers which shortage.
  // Marks OPEN shortage records as covered by the given PO, but only up to
  // the quantity actually ordered per item - not the whole shortage. If the
  // PO covers less than the total shortage for an item, the oldest OPEN
  // records get fully marked PR_RAISED first, and the remainder is either
  // partially reduced (if a record is only partly covered) or left
  // untouched OPEN so the real remaining gap stays visible on this screen.
  async markShortagesRaised(items: { itemCode: string; qtyOrdered: number }[], poId: string, user: any) {
    let totalUpdated = 0;
    for (const { itemCode, qtyOrdered } of items) {
      let remaining = qtyOrdered;
      if (remaining <= 0) continue;

      const openRows = await this.prisma.materialShortage.findMany({
        where: { companyId: user.companyId, itemCode, status: 'OPEN' },
        orderBy: { createdAt: 'asc' },
      });

      for (const row of openRows) {
        if (remaining <= 0) break;
        if (row.shortageQty <= remaining) {
          await this.prisma.materialShortage.update({
            where: { id: row.id },
            data: { status: 'PR_RAISED', prId: poId, updatedBy: user.id },
          });
          remaining -= row.shortageQty;
          totalUpdated++;
        } else {
          // Only partially covered - reduce the shortage in place, stays OPEN
          await this.prisma.materialShortage.update({
            where: { id: row.id },
            data: { shortageQty: Math.round((row.shortageQty - remaining) * 1000) / 1000, prId: poId, updatedBy: user.id },
          });
          remaining = 0;
          totalUpdated++;
        }
      }
    }
    return { updated: totalUpdated };
  }

  async getShortages(cpoId: string, user: any) {
    const cpo = await this.prisma.customerPo.findFirst({ where: { id: cpoId, companyId: user.companyId } });
    if (!cpo) throw new NotFoundException('CPO not found');

    const shortages = await this.prisma.materialShortage.findMany({
      where: { companyId: user.companyId, customerPoId: cpoId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      cpoNumber: cpo.cpoNumber,
      mrpRunAt: cpo.mrpRunAt,
      mrpRunBy: cpo.mrpRunBy,
      itemResults: cpo.lastShortageCheckResult || null,
      data: shortages,
      openCount: shortages.filter(s => s.status === 'OPEN').length,
    };
  }
}
