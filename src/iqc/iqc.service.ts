import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateIqcDto, UpdateIqcItemsDto, ConfirmReceiptDto } from './dto/iqc.dto';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { RejectedStockService } from '../rejected-stock/rejected-stock.service';
import { HoldStockService } from '../hold-stock/hold-stock.service';

@Injectable()
export class IqcService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
    private rejectedStock: RejectedStockService,
    private holdStock: HoldStockService,
  ) {}

  private async generateIqcNumber(companyId: string): Promise<string> {
    const count = await this.prisma.iqcInspection.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `IQC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      grn: { select: { grnNumber: true, grnType: true, warehouseId: true, warehouse: { select: { name: true } } } },
      items: { where: { isActive: true } },
    };
  }

  // STORE-007 sections 5-6: per line, IQC-required material goes
  // through the normal manual inspection below; material configured as
  // NOT requiring IQC never becomes an IqcItem at all - it's accepted
  // directly (its own StockLedger posting, same pattern as STORE-005's
  // DISCREPANCY_RELEASE) and routed straight toward Put-Away, closing
  // the gap where every material was inspected unconditionally. This is
  // deliberately per-line, not per-GRN: a single mixed receipt can have
  // some lines go straight through while others still need a human.
  // STORE-007 sections 26-30: partial/cumulative handover. A GRN can now
  // have multiple IqcInspection records, one per handover batch, rather
  // than exactly one. dto.items selects which lines/quantities this
  // batch covers; omitting it sends everything still remaining (keeps
  // the original one-shot call working unchanged). GrnItem.sentToIqcQty
  // tracks the running total per line so cumulative sent can never
  // exceed what's actually eligible (receivedQty - heldQty), whether
  // sent in one call or several - claimed via a conditional update
  // rather than a read-then-write, so two concurrent handovers can
  // never both succeed against the same remaining balance.
  async create(dto: CreateIqcDto, user: any) {
    const grn = await this.prisma.grnHeader.findFirst({
      where: { id: dto.grnId, companyId: user.companyId },
      include: { items: { where: { isActive: true } } },
    });
    if (!grn) throw new NotFoundException('GRN not found');
    if (grn.status !== 'IQC_PENDING') throw new BadRequestException('GRN must be in IQC_PENDING status');

    const requestedByGrnItemId = new Map<string, number>();
    if (dto.items && dto.items.length > 0) {
      for (const line of dto.items) requestedByGrnItemId.set(line.grnItemId, line.qty);
    }

    const linesToSend: { item: any; qty: number }[] = [];
    for (const item of grn.items) {
      const eligibleQty = item.receivedQty - (item.heldQty || 0);
      const remaining = eligibleQty - (item.sentToIqcQty || 0);
      let qty: number;
      if (requestedByGrnItemId.size > 0) {
        if (!requestedByGrnItemId.has(item.id)) continue;
        qty = requestedByGrnItemId.get(item.id)!;
        if (qty > remaining) {
          throw new BadRequestException(`Item ${item.itemCode}: requested ${qty} exceeds remaining eligible qty ${remaining} (already sent ${item.sentToIqcQty || 0} of ${eligibleQty})`);
        }
      } else {
        qty = remaining;
      }
      if (qty > 0) linesToSend.push({ item, qty });
    }

    if (linesToSend.length === 0) {
      throw new BadRequestException('Nothing eligible to send to IQC - every requested line is either already fully sent or has zero eligible quantity');
    }

    for (const { item, qty } of linesToSend) {
      const eligibleQty = item.receivedQty - (item.heldQty || 0);
      const claim = await this.prisma.grnItem.updateMany({
        where: { id: item.id, sentToIqcQty: { lte: eligibleQty - qty } },
        data: { sentToIqcQty: { increment: qty }, updatedBy: user.id },
      });
      if (claim.count === 0) {
        throw new BadRequestException(`Item ${item.itemCode}: could not claim ${qty} to send - the remaining eligible qty changed, likely a concurrent handover - please retry`);
      }
    }

    const itemCodes = linesToSend.map(l => l.item.itemCode);
    const [rawMaterials, products] = await Promise.all([
      this.prisma.rawMaterial.findMany({ where: { companyId: user.companyId, code: { in: itemCodes } }, select: { code: true, iqcRequired: true } }),
      this.prisma.product.findMany({ where: { companyId: user.companyId, code: { in: itemCodes } }, select: { code: true, iqcRequired: true } }),
    ]);
    const iqcRequiredByCode = new Map<string, boolean>();
    for (const rm of rawMaterials) iqcRequiredByCode.set(rm.code, rm.iqcRequired);
    for (const p of products) if (!iqcRequiredByCode.has(p.code)) iqcRequiredByCode.set(p.code, p.iqcRequired);
    // Unknown material (neither master has a matching code) defaults to
    // IQC-required - the safe default is inspection, not a silent skip.
    const requiresIqc = (itemCode: string) => iqcRequiredByCode.get(itemCode) ?? true;

    const iqcLines = linesToSend.filter(l => requiresIqc(l.item.itemCode));
    const skippedLines = linesToSend.filter(l => !requiresIqc(l.item.itemCode));

    // Directly accept the skipped lines - no IqcItem, no human inspection
    // step, but still fully audited so it's clear why no IQC record
    // exists. acceptedQty is incremented rather than set, since a line
    // could in principle be sent (and thus accepted) across more than
    // one batch over time.
    for (const { item, qty } of skippedLines) {
      await this.prisma.grnItem.update({
        where: { id: item.id },
        data: { acceptedQty: { increment: qty }, updatedBy: user.id },
      });
      await this.stockLedger.postTransaction({
        companyId: user.companyId, itemCode: item.itemCode, itemName: item.itemName,
        warehouseId: grn.warehouseId, transactionType: 'GRN_DIRECT_ACCEPT',
        referenceType: 'GRN', referenceId: grn.id, referenceNumber: grn.grnNumber,
        inQty: qty, remarks: 'IQC not required for this material - accepted directly per material master configuration',
        userId: user.id,
      });
      await this.audit.log({
        tableName: 'grn_items', recordId: item.id, action: 'UPDATE',
        newValues: { acceptedQtyIncrement: qty, reason: 'IQC_NOT_REQUIRED' }, changedBy: user.id,
      });
    }

    // If this batch contained no IQC-required lines, there's no
    // inspection to create for it. Only close the GRN outright if
    // nothing at all remains unsent and unaccepted across every line -
    // with partial handover, a batch that skips IQC is not necessarily
    // the GRN's last batch.
    if (iqcLines.length === 0) {
      const refreshedItems = await this.prisma.grnItem.findMany({ where: { grnId: grn.id, isActive: true } });
      const allDone = refreshedItems.every(i => (i.receivedQty - (i.heldQty || 0)) - (i.sentToIqcQty || 0) <= 0);
      if (allDone) {
        const updatedGrn = await this.prisma.grnHeader.update({
          where: { id: grn.id }, data: { status: 'ACCEPTED', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'grn_headers', recordId: grn.id, action: 'UPDATE', newValues: { status: 'ACCEPTED', reason: 'ALL_LINES_IQC_NOT_REQUIRED' }, changedBy: user.id });
        return { skippedIqc: true, grn: updatedGrn };
      }
      return { skippedIqc: true, grn };
    }

    const iqcNumber = await this.generateIqcNumber(user.companyId);

    const iqc = await this.prisma.iqcInspection.create({
      data: {
        iqcNumber,
        grnId: dto.grnId,
        inspectedBy: dto.inspectedBy,
        remarks: dto.remarks,
        // STORE-007 section 24-25: starts as AWAITING_QC_RECEIPT, not
        // straight into IN_PROGRESS - handover and physical QC receipt
        // are two separate events now, not one atomic action.
        status: 'AWAITING_QC_RECEIPT',
        companyId: user.companyId,
        createdBy: user.id, updatedBy: user.id,
        items: {
          // STORE-005: heldQty was already subtracted when computing
          // eligibleQty above, so held material never enters linesToSend
          // and therefore never reaches an IqcItem here either.
          create: iqcLines.map(({ item, qty }) => ({
            grnItemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            uom: item.uom,
            receivedQty: qty,
            acceptedQty: qty, // default all accepted
            rejectedQty: 0,
            companyId: user.companyId,
            createdBy: user.id, updatedBy: user.id,
          })),
        },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'iqc_inspections', recordId: iqc.id, action: 'CREATE', newValues: iqc, changedBy: user.id });
    return iqc;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ iqcNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.iqcInspection.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          grn: { select: { grnNumber: true, grnType: true, warehouse: { select: { name: true } } } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.iqcInspection.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const iqc = await this.prisma.iqcInspection.findFirst({ where, include: this.includes() });
    if (!iqc) throw new NotFoundException('IQC inspection not found');
    return iqc;
  }

  async findByGrn(grnId: string, user: any) {
    const where: any = { grnId };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.iqcInspection.findMany({ where, include: this.includes() });
  }

  async updateItems(id: string, dto: UpdateIqcItemsDto, user: any) {
    const iqc = await this.findOne(id, user);
    if (iqc.status === 'APPROVED') throw new BadRequestException('Cannot edit approved IQC');

    for (const itemUpdate of dto.items) {
      const iqcItem = iqc.items.find((i: any) => i.id === itemUpdate.id);
      if (!iqcItem) throw new BadRequestException(`IQC item ${itemUpdate.id} not found`);
      const holdQty = itemUpdate.holdQty || 0;
      if (itemUpdate.acceptedQty + itemUpdate.rejectedQty + holdQty > (iqcItem as any).receivedQty) {
        throw new BadRequestException(`Item ${(iqcItem as any).itemCode}: accepted + rejected + hold cannot exceed received qty`);
      }
      await this.prisma.iqcItem.update({
        where: { id: itemUpdate.id },
        data: {
          acceptedQty: itemUpdate.acceptedQty,
          rejectedQty: itemUpdate.rejectedQty,
          rejectionReason: itemUpdate.rejectionReason,
          holdQty,
          holdReason: itemUpdate.holdReason,
          updatedBy: user.id,
        },
      });
    }

    const updated = await this.findOne(id, user);
    await this.audit.log({ tableName: 'iqc_inspections', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // STORE-007 section 24-25: the QC-side counterpart to handover - Store
  // claimed to send receivedQty, this records what QC actually,
  // physically got. A short confirmation caps acceptedQty at what's
  // really there (can't accept more than physically present) and is
  // flagged as a handover mismatch rather than silently treated as a
  // full, uneventful handover - inspection then proceeds against the
  // confirmed reality, not Store's original claim.
  async confirmReceipt(id: string, dto: ConfirmReceiptDto, user: any) {
    const iqc = await this.findOne(id, user);
    if (iqc.status !== 'AWAITING_QC_RECEIPT') {
      throw new BadRequestException(`This inspection is not awaiting QC receipt confirmation (status is ${iqc.status})`);
    }

    const mismatches: any[] = [];
    for (const line of dto.items) {
      const item = (iqc.items as any[]).find(i => i.id === line.itemId);
      if (!item) throw new NotFoundException(`IQC item ${line.itemId} not found on this inspection`);
      if (line.confirmedQty > item.receivedQty) {
        throw new BadRequestException(`Item ${item.itemCode}: confirmed qty (${line.confirmedQty}) cannot exceed what Store sent (${item.receivedQty})`);
      }
      const shortfall = item.receivedQty - line.confirmedQty;
      const newAcceptedQty = Math.min(item.acceptedQty, line.confirmedQty);
      await this.prisma.iqcItem.update({
        where: { id: item.id },
        data: { confirmedQty: line.confirmedQty, acceptedQty: newAcceptedQty, updatedBy: user.id },
      });
      if (shortfall > 0) {
        mismatches.push({ itemCode: item.itemCode, sentQty: item.receivedQty, confirmedQty: line.confirmedQty, shortfall });
      }
    }

    const updated = await this.prisma.iqcInspection.update({
      where: { id }, data: { status: 'IN_PROGRESS', updatedBy: user.id }, include: this.includes(),
    });

    await this.audit.log({
      tableName: 'iqc_inspections', recordId: id, action: 'UPDATE',
      newValues: { status: 'IN_PROGRESS', receiptConfirmed: true, mismatches }, changedBy: user.id,
    });

    return { ...updated, handoverMismatches: mismatches };
  }

  async approve(id: string, user: any) {
    const iqc = await this.findOne(id, user);
    if (iqc.status === 'APPROVED') throw new BadRequestException('Already approved');
    if (iqc.status === 'AWAITING_QC_RECEIPT') throw new BadRequestException('QC must confirm physical receipt before this inspection can be approved');
    if (iqc.status !== 'IN_PROGRESS') throw new BadRequestException('IQC must be IN_PROGRESS before approval');

    // STORE-008 section 8: three-way reconciliation - accepted + rejected
    // + hold must never exceed received. A prior version of this check
    // only validated accepted+rejected, silently allowing hold quantity
    // to slip through unvalidated.
    for (const item of iqc.items as any[]) {
      if (item.acceptedQty + item.rejectedQty + (item.holdQty || 0) > item.receivedQty) {
        throw new BadRequestException(`Item ${item.itemCode}: quantities don't balance`);
      }
    }

    // Update IQC status
    await this.prisma.iqcInspection.update({
      where: { id }, data: { status: 'APPROVED', updatedBy: user.id },
    });

    // Credit accepted stock into the real StockBalance/StockLedger -
    // without this, materials could pass IQC and still be invisible to
    // the rest of the system (shortage checks, dashboards, production).
    await this.stockLedger.receiveFromIqc(id, user);

    // STORE-008 sections 17, 19: rejected and held material must remain
    // physically traceable, not just excluded from availableQty. This
    // was previously only wired into the separate template-escalation
    // approval path (iqc-escalation.service.ts) - the simple, direct
    // quantity-entry approve() path used everywhere else in this session
    // never created these tracking records at all, a real pre-existing
    // gap this closes.
    const totalRejectedForTracking = (iqc.items as any[]).reduce((s, i) => s + i.rejectedQty, 0);
    const totalHoldForTracking = (iqc.items as any[]).reduce((s, i) => s + (i.holdQty || 0), 0);
    if (totalRejectedForTracking > 0) {
      await this.rejectedStock.createFromIqc(id, user);
    }
    if (totalHoldForTracking > 0) {
      await this.holdStock.createFromIqc(id, user);
    }

    // Update GRN items with accepted/rejected quantities
    for (const item of iqc.items as any[]) {
      await this.prisma.grnItem.update({
        where: { id: item.grnItemId },
        data: { acceptedQty: item.acceptedQty, rejectedQty: item.rejectedQty, updatedBy: user.id },
      });
    }

    // Update GRN status
    const totalAccepted = (iqc.items as any[]).reduce((s, i) => s + i.acceptedQty, 0);
    const totalReceived = (iqc.items as any[]).reduce((s, i) => s + i.receivedQty, 0);
    const totalRejected = (iqc.items as any[]).reduce((s, i) => s + i.rejectedQty, 0);
    let grnStatus = 'ACCEPTED';
    if (totalRejected > 0 && totalAccepted > 0) grnStatus = 'PARTIALLY_ACCEPTED';
    else if (totalRejected === totalReceived) grnStatus = 'ACCEPTED'; // all rejected still closes

    await this.prisma.grnHeader.update({
      where: { id: iqc.grnId }, data: { status: grnStatus, updatedBy: user.id },
    });

    const result = await this.findOne(id, user);
    await this.audit.log({ tableName: 'iqc_inspections', recordId: id, action: 'UPDATE', newValues: result, changedBy: user.id });
    return result;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, pending, inProgress, approved] = await Promise.all([
      this.prisma.iqcInspection.count({ where }),
      this.prisma.iqcInspection.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.iqcInspection.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.iqcInspection.count({ where: { ...where, status: 'APPROVED' } }),
    ]);
    return { total, pending, inProgress, approved };
  }
}
