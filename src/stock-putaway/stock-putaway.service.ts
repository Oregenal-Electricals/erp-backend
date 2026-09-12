import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreatePutawayDto, UpdatePutawayItemsDto } from './dto/stock-putaway.dto';

@Injectable()
export class StockPutawayService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.stockPutaway.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PUT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      grn: { select: { grnNumber: true, grnType: true } },
      iqc: { select: { iqcNumber: true } },
      warehouse: { select: { name: true, code: true } },
      items: { where: { isActive: true }, include: { bin: { select: { code: true, status: true } } } },
    };
  }

  // IQC inspections that are APPROVED (material accepted, stock already
  // credited into the warehouse) but don't yet have a StockPutaway record -
  // this is what should show as "pending" on the Putaway screen, mirroring
  // the same pending-queue pattern used for GRN/IQC elsewhere.
  // STORE-008 section 34: shows only what's genuinely still eligible
  // for put-away (acceptedQty - putAwayQty already claimed at complete()
  // time), not an all-or-nothing "does this IQC have any StockPutaway at
  // all" filter. The old filter hid the remainder of a partially-put-
  // away IQC entirely once even a small first batch existed - there was
  // no way for the rest to ever show up again as pending.
  async getPendingIqcs(user: any) {
    const where: any = { status: 'APPROVED', isActive: true };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const approvedIqcs = await this.prisma.iqcInspection.findMany({
      where,
      include: {
        grn: { select: { grnNumber: true, warehouseId: true, warehouse: { select: { name: true } } } },
        items: { where: { isActive: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    // STORE-009 section 5-6, 54: suggest each material's preferred
    // location (if the material master has one configured) so Store
    // doesn't have to search the whole warehouse - a suggestion only,
    // never enforced, and never rewriting what Store actually picks.
    const itemCodes = [...new Set(approvedIqcs.flatMap((iqc: any) => iqc.items.map((i: any) => i.itemCode)))];
    const materials = itemCodes.length > 0 ? await this.prisma.rawMaterial.findMany({
      where: { companyId: user.companyId, code: { in: itemCodes as string[] } },
      select: {
        code: true,
        preferredWarehouseId: true, preferredWarehouse: { select: { name: true } },
        preferredRackId: true, preferredRack: { select: { code: true } },
        preferredBinId: true, preferredBin: { select: { code: true } },
      },
    }) : [];
    const suggestionByCode = new Map(materials.map(m => [m.code, m]));

    return approvedIqcs
      .map((iqc: any) => ({
        ...iqc,
        items: iqc.items.map((item: any) => {
          const suggestion = suggestionByCode.get(item.itemCode);
          return {
            ...item,
            remainingPutAwayQty: Math.max(item.acceptedQty - (item.putAwayQty || 0), 0),
            suggestedLocation: suggestion?.preferredBinId ? {
              warehouseId: suggestion.preferredWarehouseId, warehouseName: suggestion.preferredWarehouse?.name,
              rackId: suggestion.preferredRackId, rackCode: suggestion.preferredRack?.code,
              binId: suggestion.preferredBinId, binCode: suggestion.preferredBin?.code,
            } : null,
          };
        }),
      }))
      .filter((iqc: any) => iqc.items.some((item: any) => item.remainingPutAwayQty > 0));
  }

  async create(dto: CreatePutawayDto, user: any) {
    const grn = await this.prisma.grnHeader.findFirst({ where: { id: dto.grnId, companyId: user.companyId } });
    if (!grn) throw new NotFoundException('GRN not found');

    // STORE-009 section 21-22: if any item's material is restricted to a
    // specific warehouse, putting it away anywhere else needs an
    // explicit override reason - not silently accepted, but not a hard
    // block either, since a genuinely authorized exception should still
    // be possible.
    if (dto.items && dto.items.length > 0) {
      const codes = [...new Set(dto.items.map(i => i.itemCode))];
      const restricted = await this.prisma.rawMaterial.findMany({
        where: { companyId: user.companyId, code: { in: codes }, restrictedWarehouseId: { not: null } },
        select: { code: true, restrictedWarehouseId: true, restrictedWarehouse: { select: { name: true } } },
      });
      for (const material of restricted) {
        if (material.restrictedWarehouseId !== dto.warehouseId && !dto.overrideReason) {
          throw new BadRequestException(
            `Item ${material.code} is restricted to ${material.restrictedWarehouse?.name || 'a specific warehouse'} - provide an overrideReason to put it away elsewhere.`,
          );
        }
      }
    }

    const putawayNumber = await this.generateNumber(user.companyId);

    // STORE-009 section 12-13, 30-31: auto-link each line to the batch it
    // actually came from, so "which batch is in which bin" has an answer.
    // The IqcItem already carries the batchNumber (propagated from the
    // GRN line at handover time); StockBatch is looked up by that number
    // rather than requiring the frontend to know or pass a batch id.
    let itemsData: any[] | undefined;
    if (dto.items) {
      itemsData = [];
      for (const item of dto.items) {
        let stockBatchId: string | undefined;
        if (item.iqcItemId) {
          const iqcItem = await this.prisma.iqcItem.findUnique({ where: { id: item.iqcItemId } });
          if (iqcItem?.batchNumber) {
            const batch = await this.prisma.stockBatch.findFirst({ where: { companyId: user.companyId, batchNumber: iqcItem.batchNumber } });
            if (batch) stockBatchId = batch.id;
          }
        }
        itemsData.push({ ...item, stockBatchId, companyId: user.companyId, createdBy: user.id, updatedBy: user.id });
      }
    }

    const putaway = await this.prisma.stockPutaway.create({
      data: {
        putawayNumber, grnId: dto.grnId, iqcId: dto.iqcId,
        warehouseId: dto.warehouseId, remarks: dto.remarks,
        status: 'IN_PROGRESS',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: itemsData ? { create: itemsData } : undefined,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'stock_putaway', recordId: putaway.id, action: 'CREATE', newValues: putaway, changedBy: user.id });
    return putaway;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ putawayNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.stockPutaway.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          grn: { select: { grnNumber: true } },
          warehouse: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.stockPutaway.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const putaway = await this.prisma.stockPutaway.findFirst({ where, include: this.includes() });
    if (!putaway) throw new NotFoundException('Putaway not found');
    return putaway;
  }

  async updateItems(id: string, dto: UpdatePutawayItemsDto, user: any) {
    const putaway = await this.findOne(id, user);
    if (putaway.status === 'COMPLETED') throw new BadRequestException('Cannot edit completed putaway');

    // Delete existing items and recreate
    await this.prisma.stockPutawayItem.deleteMany({ where: { putawayId: id } });
    await this.prisma.stockPutaway.update({
      where: { id },
      data: {
        items: { create: dto.items.map(item => ({ ...item, companyId: user.companyId, createdBy: user.id, updatedBy: user.id })) },
        updatedBy: user.id,
      },
    });
    return this.findOne(id, user);
  }

  async complete(id: string, user: any) {
    const putaway = await this.findOne(id, user);
    if (putaway.status === 'COMPLETED') throw new BadRequestException('Already completed');
    if (!putaway.items || putaway.items.length === 0) throw new BadRequestException('No items to putaway');

    const qtyByIqcItemId = new Map<string, number>();
    for (const item of putaway.items as any[]) {
      if (!item.iqcItemId) continue;
      qtyByIqcItemId.set(item.iqcItemId, (qtyByIqcItemId.get(item.iqcItemId) || 0) + item.qty);
    }
    for (const [iqcItemId, qty] of qtyByIqcItemId) {
      const iqcItem = await this.prisma.iqcItem.findUnique({ where: { id: iqcItemId } });
      if (!iqcItem) continue;
      const remaining = iqcItem.acceptedQty - (iqcItem.putAwayQty || 0);
      if (qty > remaining) {
        throw new BadRequestException(
          `Item ${iqcItem.itemCode}: putting away ${qty} would exceed the remaining accepted qty (${remaining} left of ${iqcItem.acceptedQty} accepted, ${iqcItem.putAwayQty || 0} already put away).`,
        );
      }
      const claim = await this.prisma.iqcItem.updateMany({
        where: { id: iqcItemId, putAwayQty: { lte: iqcItem.acceptedQty - qty } },
        data: { putAwayQty: { increment: qty }, updatedBy: user.id },
      });
      if (claim.count === 0) {
        throw new BadRequestException(`Item ${iqcItem.itemCode}: could not claim ${qty} for put-away - the remaining accepted qty changed concurrently, please retry.`);
      }
    }

    // Validate every item fits its bin's physical capacity BEFORE writing
    // anything - a bin's maxQty was previously only used to choose the
    // FULL/PARTIAL status label, never to actually stop an over-capacity
    // quantity from being recorded. Checking everything up front (rather
    // than failing partway through the loop below) keeps this atomic: no
    // bins get updated at all if any single item would overflow.
    const bins = new Map<string, { currentQty: number; maxQty: number | null; code: string }>();
    for (const item of putaway.items as any[]) {
      const bin = await this.prisma.warehouseBin.findUnique({ where: { id: item.binId } });
      if (!bin) continue;
      const alreadyPlanned = bins.get(item.binId)?.currentQty ?? bin.currentQty;
      const newQty = alreadyPlanned + item.qty;
      if (bin.maxQty && newQty > bin.maxQty) {
        throw new BadRequestException(
          `Bin ${bin.code} can only hold ${bin.maxQty} but this putaway would bring it to ${newQty} (already has ${bin.currentQty}, adding ${item.qty}). Split this item across multiple bins or choose a bin with more capacity.`,
        );
      }
      bins.set(item.binId, { currentQty: newQty, maxQty: bin.maxQty, code: bin.code });
    }

    // Update each bin status
    for (const item of putaway.items as any[]) {
      const bin = await this.prisma.warehouseBin.findUnique({ where: { id: item.binId } });
      if (!bin) continue;
      const newQty = bin.currentQty + item.qty;
      let newStatus = 'PARTIAL';
      if (bin.maxQty && newQty >= bin.maxQty) newStatus = 'FULL';
      await this.prisma.warehouseBin.update({
        where: { id: item.binId },
        data: { currentQty: newQty, itemCode: item.itemCode, status: newStatus, updatedBy: user.id },
      });
    }

    // STORE-010: this is the actual moment material becomes genuinely
    // Available - not IQC approval. Moves each item's qty out of
    // putAwayPendingQty and into availableQty as two ledger-backed legs
    // (a debit and a credit), so total physical never changes but the
    // status split does. Items with no iqcItemId came from a source
    // that already went straight to availableQty (e.g. IQC-not-required
    // direct-accept), so there's nothing to transfer for those.
    for (const item of putaway.items as any[]) {
      if (!item.iqcItemId || item.qty <= 0) continue;
      await this.stockLedger.postTransaction({
        companyId: user.companyId, itemCode: item.itemCode, itemName: item.itemName,
        warehouseId: putaway.warehouseId, transactionType: 'PUTAWAY',
        referenceType: 'STOCK_PUTAWAY', referenceId: putaway.id, referenceNumber: putaway.putawayNumber,
        outQty: item.qty, remarks: `Put away to bin - leaving Put-Away Pending`,
        userId: user.id, targetField: 'putAwayPending',
      });
      await this.stockLedger.postTransaction({
        companyId: user.companyId, itemCode: item.itemCode, itemName: item.itemName,
        warehouseId: putaway.warehouseId, transactionType: 'PUTAWAY',
        referenceType: 'STOCK_PUTAWAY', referenceId: putaway.id, referenceNumber: putaway.putawayNumber,
        inQty: item.qty, remarks: `Put away to bin - now Available`,
        userId: user.id, targetField: 'available',
      });
    }

    const updated = await this.prisma.stockPutaway.update({
      where: { id }, data: { status: 'COMPLETED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'stock_putaway', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, inProgress, completed] = await Promise.all([
      this.prisma.stockPutaway.count({ where }),
      this.prisma.stockPutaway.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.stockPutaway.count({ where: { ...where, status: 'COMPLETED' } }),
    ]);
    const totalQty = await this.prisma.stockPutawayItem.aggregate({
      where: { companyId: where.companyId }, _sum: { qty: true },
    });
    return { total, inProgress, completed, totalQtyPutaway: totalQty._sum.qty || 0 };
  }

  // STORE-009 section 39: "search LED Driver, see total available and
  // exactly which bins it's in" - a few clicks, not a hunt through
  // multiple screens. StockPutawayItem is the actual record of "which
  // bin has which qty" (StockBatch only tracks warehouse-level), so this
  // groups completed put-away lines by bin for that material.
  async findByItem(itemCode: string, user: any) {
    const where: any = { itemCode, putaway: { status: 'COMPLETED' } };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const items = await this.prisma.stockPutawayItem.findMany({
      where,
      include: {
        bin: { select: { code: true, rack: { select: { code: true } } } },
        stockBatch: { select: { batchNumber: true, expiryDate: true } },
        putaway: { select: { warehouse: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    return { itemCode, totalQty, locations: items };
  }
}
