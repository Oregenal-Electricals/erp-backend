import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateAdjustmentDto } from './dto/stock-adjustment.dto';

@Injectable()
export class StockAdjustmentService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.stockAdjustment.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `ADJ-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      warehouse: { select: { name: true, code: true } },
      items: { where: { isActive: true } },
    };
  }

  // STORE-016 section 21: ERP Expected Qty is never something the
  // caller supplies - it's looked up here, server-side, from whichever
  // table is that status's own existing source of truth (mirroring
  // STORE-010's getMaterialSummary(), which this reuses directly rather
  // than recomputing the same numbers a second way).
  private async getSystemQty(itemCode: string, status: string, user: any): Promise<number> {
    const summary = await this.stockLedger.getMaterialSummary(itemCode, user);
    switch (status) {
      case 'HOLD': return summary.hold;
      case 'REJECTED': return summary.rejected;
      case 'QC_PENDING': return summary.qcPending;
      case 'AVAILABLE':
      default: return summary.available;
    }
  }

  async create(dto: CreateAdjustmentDto, user: any) {
    if (!dto.items || dto.items.length === 0) throw new BadRequestException('Adjustment must have at least one item');

    const adjustmentNumber = await this.generateNumber(user.companyId);

    // STORE-016 section 62: same material+status(+batch/bin where
    // given) counted twice in one submission is a duplicate count
    // line, not two independent variances - block it rather than
    // silently double-counting.
    const seen = new Set<string>();
    for (const item of dto.items) {
      const key = `${item.itemCode}|${item.status || 'AVAILABLE'}|${item.batchId || ''}|${item.binId || ''}`;
      if (seen.has(key)) {
        throw new BadRequestException(`${item.itemCode} (${item.status || 'AVAILABLE'}) appears more than once in this count - each material/status/batch/location combination may only be counted once per submission.`);
      }
      seen.add(key);
    }

    // adjustmentQty is always physicalQty - systemQty, for every type: positive
    // means stock goes up, negative means it goes down - matching exactly what
    // approve() below does with the sign. adjustmentType is a label for WHY the
    // adjustment happened (found more / found less / recounted), not a
    // separate instruction for which direction to apply - it must never flip
    // the sign of the math, or a genuine decrease (physical count lower than
    // system, the normal reason to raise a DECREASE adjustment) silently adds
    // stock instead of removing it.
    const items: any[] = [];
    for (const item of dto.items) {
      const status = item.status || 'AVAILABLE';
      const systemQty = await this.getSystemQty(item.itemCode, status, user);
      const adjustmentQty = item.physicalQty - systemQty;
      if (dto.adjustmentType === 'INCREASE' && adjustmentQty < 0) {
        throw new BadRequestException(`${item.itemCode}: physicalQty is less than systemQty - this is a decrease, not an increase. Use adjustmentType DECREASE or RECOUNT.`);
      }
      if (dto.adjustmentType === 'DECREASE' && adjustmentQty > 0) {
        throw new BadRequestException(`${item.itemCode}: physicalQty is more than systemQty - this is an increase, not a decrease. Use adjustmentType INCREASE or RECOUNT.`);
      }
      items.push({ ...item, status, systemQty, adjustmentQty });
    }

    const adjustment = await this.prisma.stockAdjustment.create({
      data: {
        adjustmentNumber, warehouseId: dto.warehouseId,
        adjustmentType: dto.adjustmentType, reason: dto.reason,
        remarks: dto.remarks, status: 'DRAFT',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: { create: items.map(item => ({ ...item, companyId: user.companyId, createdBy: user.id, updatedBy: user.id })) },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'stock_adjustments', recordId: adjustment.id, action: 'CREATE', newValues: adjustment, changedBy: user.id });
    return adjustment;
  }

  async approve(id: string, user: any) {
    const adj = await this.prisma.stockAdjustment.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: true },
    });
    if (!adj) throw new NotFoundException('Adjustment not found');
    if (adj.status !== 'DRAFT') throw new BadRequestException('Only DRAFT adjustments can be approved');

    for (const item of adj.items as any[]) {
      const diff = item.adjustmentQty;
      if (diff === 0) continue;
      const status = item.status || 'AVAILABLE';

      // STORE-016 sections 19-20, 46-47: a Hold/Rejected/QC-Pending
      // variance is real and worth recording (the count line above
      // already captured it), but posting it against those controlled
      // statuses through this generic path risks silently turning Hold
      // or Rejected into Available - safer to require the existing
      // Hold/QC workflow to action it than to guess here.
      if (status !== 'AVAILABLE') {
        throw new BadRequestException(`${item.itemCode} has a ${status} variance (${diff > 0 ? '+' : ''}${diff}) - this is recorded for review, but posting a ${status} adjustment must go through the existing ${status === 'HOLD' ? 'Hold reinspection' : status === 'QC_PENDING' ? 'IQC' : 'Rejected-stock'} workflow, not a generic stock adjustment.`);
      }

      const balance = await this.prisma.stockBalance.findFirst({
        where: { companyId: user.companyId, warehouseId: adj.warehouseId, itemCode: item.itemCode },
      });

      if (diff < 0) {
        if (!balance || balance.availableQty < Math.abs(diff)) {
          throw new BadRequestException(`Insufficient stock for ${item.itemCode}. Available: ${balance?.availableQty || 0}`);
        }
        // STORE-016 sections 42-44: a negative adjustment must never
        // silently leave Reserved greater than the new Available -
        // that is an invalid state (a WO's committed material vanishing
        // from under it), and existing reservations need controlled
        // review/reallocation, not a silent corruption here.
        const newAvailable = balance.availableQty - Math.abs(diff);
        if (balance.reservedQty > newAvailable + 0.0001) {
          throw new BadRequestException(`Posting this decrease would leave Reserved (${balance.reservedQty}) greater than the new Available (${newAvailable}) for ${item.itemCode} - resolve the reservation shortfall (release or reallocate the affected reservations) before posting this adjustment.`);
        }
      }

      // Post to stock ledger
      await this.stockLedger.postTransaction({
        companyId: user.companyId,
        itemCode: item.itemCode, itemName: item.itemName,
        warehouseId: adj.warehouseId,
        transactionType: 'ADJUSTMENT',
        referenceType: 'STOCK_ADJUSTMENT',
        referenceId: adj.id, referenceNumber: adj.adjustmentNumber,
        inQty: diff > 0 ? diff : 0,
        outQty: diff < 0 ? Math.abs(diff) : 0,
        unitCost: item.unitCost,
        remarks: `${adj.adjustmentType} - ${adj.reason}`,
        userId: user.id,
      });
    }

    const updated = await this.prisma.stockAdjustment.update({
      where: { id }, data: { status: 'APPROVED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'stock_adjustments', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // STORE-016 sections 69-70: a wrongly-posted adjustment is never
  // deleted - it gets a validated reversal instead, blocked if the
  // stock it touched has since moved on (issued, transferred, etc.)
  // in a way that would drive balance negative.
  async reverse(id: string, user: any, reason: string) {
    const adj = await this.prisma.stockAdjustment.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: true },
    });
    if (!adj) throw new NotFoundException('Adjustment not found');
    if (adj.status !== 'APPROVED') throw new BadRequestException('Only an APPROVED adjustment can be reversed');

    for (const item of adj.items as any[]) {
      const diff = item.adjustmentQty;
      if (diff === 0) continue;
      // Reversing means undoing the original move: an original +diff
      // is reversed by an outQty of diff; an original -diff is
      // reversed by an inQty of |diff|.
      if (diff > 0) {
        const balance = await this.prisma.stockBalance.findFirst({
          where: { companyId: user.companyId, warehouseId: adj.warehouseId, itemCode: item.itemCode },
        });
        if (!balance || balance.availableQty < diff) {
          throw new BadRequestException(`Cannot reverse ${item.itemCode}: only ${balance?.availableQty || 0} remains available, but the original adjustment added ${diff} - some of it has already been used downstream. A full reversal would create invalid stock.`);
        }
      }
      await this.stockLedger.postTransaction({
        companyId: user.companyId,
        itemCode: item.itemCode, itemName: item.itemName,
        warehouseId: adj.warehouseId,
        transactionType: 'ADJUSTMENT',
        referenceType: 'STOCK_ADJUSTMENT_REVERSAL',
        referenceId: adj.id, referenceNumber: `${adj.adjustmentNumber}-REV`,
        inQty: diff < 0 ? Math.abs(diff) : 0,
        outQty: diff > 0 ? diff : 0,
        unitCost: item.unitCost,
        remarks: `Reversal of ${adj.adjustmentNumber}: ${reason}`,
        userId: user.id,
      });
    }

    const reversal = await this.prisma.stockAdjustment.create({
      data: {
        adjustmentNumber: `${adj.adjustmentNumber}-REV`,
        warehouseId: adj.warehouseId, adjustmentType: adj.adjustmentType === 'INCREASE' ? 'DECREASE' : (adj.adjustmentType === 'DECREASE' ? 'INCREASE' : 'RECOUNT'),
        reason: adj.reason, remarks: `Reversal of ${adj.adjustmentNumber}: ${reason}`,
        status: 'APPROVED', reversedAdjustmentId: adj.id,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: {
          create: (adj.items as any[]).map(item => ({
            companyId: user.companyId, itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
            status: item.status, binId: item.binId, batchId: item.batchId,
            systemQty: item.physicalQty, physicalQty: item.systemQty, adjustmentQty: -item.adjustmentQty,
            unitCost: item.unitCost, createdBy: user.id, updatedBy: user.id,
          })),
        },
      },
      include: this.includes(),
    });

    await this.prisma.stockAdjustment.update({ where: { id }, data: { status: 'REVERSED', updatedBy: user.id } });
    await this.audit.log({ tableName: 'stock_adjustments', recordId: reversal.id, action: 'CREATE', newValues: reversal, changedBy: user.id });
    return reversal;
  }

  async cancel(id: string, user: any) {
    const adj = await this.prisma.stockAdjustment.findFirst({ where: { id, companyId: user.companyId } });
    if (!adj) throw new NotFoundException('Adjustment not found');
    if (adj.status !== 'DRAFT') throw new BadRequestException('Only DRAFT adjustments can be cancelled');
    return this.prisma.stockAdjustment.update({ where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes() });
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ adjustmentNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { warehouse: { select: { name: true } }, _count: { select: { items: true } } },
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const adj = await this.prisma.stockAdjustment.findFirst({ where, include: this.includes() });
    if (!adj) throw new NotFoundException('Adjustment not found');
    return adj;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, approved, cancelled] = await Promise.all([
      this.prisma.stockAdjustment.count({ where }),
      this.prisma.stockAdjustment.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.stockAdjustment.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.stockAdjustment.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    const byType = await this.prisma.stockAdjustment.groupBy({ by: ['adjustmentType'], where, _count: true });
    const byReason = await this.prisma.stockAdjustment.groupBy({ by: ['reason'], where: { ...where, status: 'APPROVED' }, _count: true });
    return { total, draft, approved, cancelled, byType, byReason };
  }
}
