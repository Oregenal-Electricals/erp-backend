import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { AdjustStockDto } from './dto/stock-ledger.dto';
import { CustomerPoService } from '../customer-po/customer-po.service';

@Injectable()
export class StockLedgerService {
  constructor(private prisma: PrismaService, private audit: AuditService, private customerPoService: CustomerPoService) {}

  // Core method: update stock balance and create ledger entry
  async postTransaction(data: {
    companyId: string; itemCode: string; itemName: string;
    warehouseId: string; transactionType: string;
    referenceType?: string; referenceId?: string; referenceNumber?: string;
    inQty?: number; outQty?: number; unitCost?: number; remarks?: string;
    userId: string;
  }) {
    const { companyId, itemCode, itemName, warehouseId, transactionType,
      referenceType, referenceId, referenceNumber, inQty = 0, outQty = 0,
      unitCost = 0, remarks, userId } = data;

    // Get or create stock balance
    let balance = await this.prisma.stockBalance.findFirst({
      where: { companyId, itemCode, warehouseId },
    });

    if (!balance) {
      balance = await this.prisma.stockBalance.create({
        data: {
          companyId, itemCode, itemName, warehouseId,
          availableQty: 0, unitCost: 0, totalValue: 0,
          createdBy: userId, updatedBy: userId,
        },
      });
    }

    // Check negative stock rule
    if (outQty > 0 && balance.availableQty < outQty) {
      throw new BadRequestException(`Insufficient stock for ${itemCode}. Available: ${balance.availableQty}, Required: ${outQty}`);
    }

    const newBalance = balance.availableQty + inQty - outQty;
    const totalCost = inQty * unitCost || outQty * balance.unitCost;

    // Weighted average cost for incoming stock
    let newUnitCost = balance.unitCost;
    if (inQty > 0 && unitCost > 0) {
      const existingValue = balance.availableQty * balance.unitCost;
      const newValue = inQty * unitCost;
      newUnitCost = (existingValue + newValue) / (balance.availableQty + inQty);
    }

    // Create ledger entry
    const ledgerEntry = await this.prisma.stockLedger.create({
      data: {
        companyId, itemCode, itemName, warehouseId,
        transactionType, referenceType, referenceId, referenceNumber,
        inQty, outQty, balanceQty: newBalance,
        unitCost: inQty > 0 ? unitCost : balance.unitCost,
        totalCost, remarks,
        createdBy: userId, updatedBy: userId,
      },
    });

    // Update stock balance
    await this.prisma.stockBalance.update({
      where: { id: balance.id },
      data: {
        availableQty: newBalance,
        unitCost: newUnitCost,
        totalValue: newBalance * newUnitCost,
        lastUpdated: new Date(),
        updatedBy: userId,
      },
    });

    // Stock genuinely increased - re-check every open Customer PO so
    // shortage numbers stay live without needing a manual re-check.
    if (inQty > 0) {
      try {
        await this.customerPoService.recheckAllOpenPos(companyId, userId);
      } catch (e) {
        // swallow - the stock posting itself must still succeed
      }
    }

    return ledgerEntry;
  }

  // Approved IQCs that don't yet have any stock_ledger entry referencing
  // them - what should actually show as "ready to receive" on this panel.
  // Every approve() call already auto-receives stock, so in normal
  // operation this stays empty; it's a safety net for any historical or
  // edge-case gaps rather than a routine manual step.
  async getPendingReceive(user: any) {
    const where: any = { status: 'APPROVED', isActive: true };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const approvedIqcs = await this.prisma.iqcInspection.findMany({
      where,
      include: {
        grn: { select: { grnNumber: true, warehouseId: true, warehouse: { select: { name: true } } } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const alreadyReceived = await this.prisma.stockLedger.findMany({
      where: { companyId: user.companyId, referenceType: 'IQC', referenceId: { in: approvedIqcs.map(i => i.id) } },
      select: { referenceId: true },
    });
    const receivedIqcIds = new Set(alreadyReceived.map(r => r.referenceId));
    return approvedIqcs.filter(iqc => !receivedIqcIds.has(iqc.id));
  }

  async receiveFromIqc(iqcId: string, user: any) {
    const iqc = await this.prisma.iqcInspection.findFirst({
      where: { id: iqcId, companyId: user.companyId },
      include: {
        items: { where: { isActive: true } },
        grn: { include: { ipo: true, po: true } },
      },
    });
    if (!iqc) throw new NotFoundException('IQC not found');
    if (iqc.status !== 'APPROVED') throw new BadRequestException('IQC must be APPROVED');

    // Guard against double-crediting: approve() already calls this
    // automatically, so a manual retry (e.g. from a stock page's "Receive"
    // button) must not create duplicate ledger entries for the same IQC.
    const alreadyReceived = await this.prisma.stockLedger.findFirst({
      where: { companyId: user.companyId, referenceType: 'IQC', referenceId: iqcId },
    });
    if (alreadyReceived) throw new BadRequestException(`Stock has already been received for ${iqc.iqcNumber}`);

    const grn = iqc.grn as any;
    const entries = [];

    for (const item of iqc.items) {
      if (item.acceptedQty > 0) {
        // Get landed cost per unit from GRN item
        const grnItem = await this.prisma.grnItem.findFirst({ where: { id: item.grnItemId } });
        const unitCost = grnItem?.landedCostPerUnit || grnItem?.unitPrice || 0;

        const entry = await this.postTransaction({
          companyId: user.companyId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          warehouseId: grn.warehouseId,
          transactionType: 'IQC_ACCEPT',
          referenceType: 'IQC',
          referenceId: iqcId,
          referenceNumber: iqc.iqcNumber,
          inQty: item.acceptedQty,
          unitCost,
          remarks: `Stock received from IQC ${iqc.iqcNumber}`,
          userId: user.id,
        });
        entries.push(entry);
      }
    }

    await this.audit.log({ tableName: 'stock_ledger', recordId: iqcId, action: 'CREATE', newValues: { entries: entries.length }, changedBy: user.id });
    return { message: `${entries.length} stock entries created`, entries };
  }

  /**
   * Credits finished-goods stock into StockBalance/StockLedger - but only
   * once Outgoing QC has actually PASSED and RELEASED the lot. This is the
   * FG mirror of receiveFromIqc(): before this runs, an FG Receipt marks
   * material as physically received into Store, but it stays completely
   * invisible to StockBalance (and therefore to dispatch, shortage checks,
   * and downstream production reservation) until OQC clears it. A failed
   * or still-pending OQC inspection can never release, so that stock never
   * silently becomes available - Store is a real checkpoint on FG the same
   * way IQC already is on raw materials, not just a paperwork record.
   */
  async receiveFromOqc(oqcId: string, user: any) {
    const oqc = await this.prisma.oqcInspection.findFirst({
      where: { id: oqcId, companyId: user.companyId },
      include: { fgReceipt: true },
    });
    if (!oqc) throw new NotFoundException('OQC inspection not found');
    if (oqc.status !== 'RELEASED') throw new BadRequestException('OQC must be RELEASED');
    if (!oqc.fgReceipt) throw new BadRequestException('OQC has no linked FG Receipt to credit stock for');

    // Guard against double-crediting: release() already calls this
    // automatically, so a manual retry must not create duplicate ledger
    // entries for the same OQC.
    const alreadyReceived = await this.prisma.stockLedger.findFirst({
      where: { companyId: user.companyId, referenceType: 'OQC', referenceId: oqcId },
    });
    if (alreadyReceived) throw new BadRequestException(`Stock has already been received for ${oqc.oqcNumber}`);

    const fgReceipt = oqc.fgReceipt;
    // A PASS result releases the full received lot, not just the sampled
    // quantity - sampleSize/passQty are a statistical check on the batch,
    // standard AQL-style lot inspection, not a per-unit accept/reject.
    const entry = await this.postTransaction({
      companyId: user.companyId,
      itemCode: fgReceipt.itemCode,
      itemName: fgReceipt.itemName,
      warehouseId: fgReceipt.warehouseId,
      transactionType: 'RECEIPT',
      referenceType: 'OQC',
      referenceId: oqcId,
      referenceNumber: oqc.oqcNumber,
      inQty: fgReceipt.receivedQty,
      unitCost: fgReceipt.unitCost,
      remarks: `FG stock released to Store after OQC ${oqc.oqcNumber} PASS`,
      userId: user.id,
    });

    if (fgReceipt.batchNumber) {
      await this.prisma.stockBatch.create({
        data: {
          batchNumber: fgReceipt.batchNumber, itemCode: fgReceipt.itemCode,
          itemName: fgReceipt.itemName, warehouseId: fgReceipt.warehouseId,
          originalQty: fgReceipt.receivedQty, availableQty: fgReceipt.receivedQty,
          unitCost: fgReceipt.unitCost, status: 'ACTIVE',
          companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        },
      }).catch(() => {});
    }

    await this.audit.log({ tableName: 'stock_ledger', recordId: oqcId, action: 'CREATE', newValues: { entry }, changedBy: user.id });
    return { message: 'Stock entry created', entry };
  }

  async findLedger(user: any, query: any) {
    const { page = 1, limit = 20, itemCode, warehouseId, transactionType } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (itemCode) where.itemCode = { contains: itemCode, mode: 'insensitive' };
    if (warehouseId) where.warehouseId = warehouseId;
    if (transactionType) where.transactionType = transactionType;

    const [data, total] = await Promise.all([
      this.prisma.stockLedger.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { warehouse: { select: { name: true, code: true } } },
      }),
      this.prisma.stockLedger.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findBalance(user: any, query: any) {
    const { page = 1, limit = 50, search, warehouseId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { itemCode: { contains: search, mode: 'insensitive' } },
      { itemName: { contains: search, mode: 'insensitive' } },
    ];
    if (warehouseId) where.warehouseId = warehouseId;

    const [data, total] = await Promise.all([
      this.prisma.stockBalance.findMany({
        where, skip, take: Number(limit), orderBy: { itemCode: 'asc' },
        include: { warehouse: { select: { name: true, code: true } } },
      }),
      this.prisma.stockBalance.count({ where }),
    ]);

    // Attach minimum stock threshold from the raw material master (finished
    // Products don't have an equivalent stock-reorder field in the schema
    // yet - minOrderQty means something different, minimum purchase qty)
    // so the frontend can flag low-stock items without a second round trip.
    const codes = data.map(d => d.itemCode);
    const rawMaterials = await this.prisma.rawMaterial.findMany({ where: { code: { in: codes } }, select: { code: true, minStockLevel: true } });
    const minLevelByCode = new Map<string, number>();
    for (const rm of rawMaterials) if (rm.minStockLevel != null) minLevelByCode.set(rm.code, rm.minStockLevel);

    // Where physically is this stock right now - a store person managing
    // shelf space needs the bin location as much as the quantity. A bin
    // holds one item at a time (see WarehouseBin.itemCode), so this is a
    // straight lookup, not an aggregation.
    const bins = await this.prisma.warehouseBin.findMany({
      where: { itemCode: { in: codes }, currentQty: { gt: 0 }, isActive: true, ...(warehouseId ? { warehouseId } : {}) },
      select: { itemCode: true, code: true, currentQty: true, warehouseId: true },
    });
    const binsByCode = new Map<string, { code: string; currentQty: number }[]>();
    for (const b of bins) {
      if (!binsByCode.has(b.itemCode!)) binsByCode.set(b.itemCode!, []);
      binsByCode.get(b.itemCode!)!.push({ code: b.code, currentQty: b.currentQty });
    }

    const enriched = data.map(row => {
      const minStockLevel = minLevelByCode.get(row.itemCode) ?? null;
      return {
        ...row,
        minStockLevel,
        isLowStock: minStockLevel != null && row.availableQty < minStockLevel,
        bins: binsByCode.get(row.itemCode) || [],
      };
    });

    return { data: enriched, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getItemLedger(itemCode: string, user: any) {
    const where: any = { itemCode };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.stockLedger.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 50,
      include: { warehouse: { select: { name: true } } },
    });
  }

  async adjust(dto: AdjustStockDto, user: any) {
    const inQty = dto.adjustmentType === 'ADD' ? dto.qty : 0;
    const outQty = dto.adjustmentType === 'REMOVE' ? dto.qty : 0;
    return this.postTransaction({
      companyId: user.companyId,
      itemCode: dto.itemCode,
      itemName: dto.itemCode,
      warehouseId: dto.warehouseId,
      transactionType: 'ADJUSTMENT',
      inQty, outQty,
      unitCost: dto.unitCost,
      remarks: dto.remarks,
      userId: user.id,
    });
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [totalItems, totalMovements, totalValue, allBalances] = await Promise.all([
      this.prisma.stockBalance.count({ where: { ...where, availableQty: { gt: 0 } } }),
      this.prisma.stockLedger.count({ where }),
      this.prisma.stockBalance.aggregate({ where, _sum: { totalValue: true } }),
      this.prisma.stockBalance.findMany({ where, select: { itemCode: true, availableQty: true } }),
    ]);
    const byType = await this.prisma.stockLedger.groupBy({ by: ['transactionType'], where, _count: true, _sum: { inQty: true, outQty: true } });

    const codes = allBalances.map(b => b.itemCode);
    const rawMaterials = await this.prisma.rawMaterial.findMany({ where: { code: { in: codes } }, select: { code: true, minStockLevel: true } });
    const minLevelByCode = new Map<string, number>();
    for (const rm of rawMaterials) if (rm.minStockLevel != null) minLevelByCode.set(rm.code, rm.minStockLevel);
    const lowStockCount = allBalances.filter(b => {
      const min = minLevelByCode.get(b.itemCode);
      return min != null && b.availableQty < min;
    }).length;

    return { totalItems, totalMovements, totalValue: totalValue._sum.totalValue || 0, byType, lowStockCount };
  }
}
