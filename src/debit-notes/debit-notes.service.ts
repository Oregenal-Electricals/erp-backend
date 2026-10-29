import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { UpdateDebitNoteStatusDto } from './dto/debit-note.dto';

export interface CreateDebitNoteFromIqcRejectionParams {
  iqcItemId: string;
  rejectedQty: number;
  rejectionReason?: string;
}

@Injectable()
export class DebitNotesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string, client: any = this.prisma): Promise<string> {
    const count = await client.debitNote.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `DN-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      vendor: { select: { name: true, code: true } },
    };
  }

  /**
   * IQC-055: auto-triggered from IqcEscalationService.closeAsFail(),
   * inside the same transaction as the IqcItem being marked finally
   * FAILed - Admin-tier management declined to grant a deviation, so
   * the rejected quantity is going back to the vendor, and this is the
   * formal record of what that reduces from what the company owes
   * them. Never a manual follow-up step the user has to remember.
   *
   * Accepts an optional transaction client (`tx`); defaults to the
   * normal prisma client so this also works standalone (e.g. a future
   * manual/backfill call) without forcing a transaction on the caller.
   * Audit logging is deliberately left to the caller to do AFTER its
   * own transaction resolves (this codebase's existing convention -
   * see CustomerPoService.acknowledge / DispatchPlanningService.create
   * - so a rolled-back transaction never leaves an orphan audit row).
   *
   * Returns null (creates nothing) when the rejected line has no
   * traceable PO chain (e.g. a non-PO/transfer-origin GRN) - there is
   * no vendor to debit in that case, and this is intentionally silent
   * rather than throwing, since it runs automatically inside the IQC
   * escalation flow and must never block the final-fail decision
   * itself from being recorded.
   */
  async createFromIqcRejection(
    params: CreateDebitNoteFromIqcRejectionParams,
    user: any,
    tx: any = this.prisma,
  ) {
    if (!params.rejectedQty || params.rejectedQty <= 0) return null;

    const item = await tx.iqcItem.findFirst({ where: { id: params.iqcItemId } });
    if (!item) return null;

    const [iqc, grnItem] = await Promise.all([
      tx.iqcInspection.findFirst({ where: { id: item.iqcId } }),
      tx.grnItem.findFirst({ where: { id: item.grnItemId } }),
    ]);
    if (!iqc) return null;

    const grn = await tx.grnHeader.findFirst({ where: { id: iqc.grnId } });
    if (!grn?.poId) return null; // no PO chain - nothing to debit a vendor against

    const po = await tx.purchaseOrder.findFirst({ where: { id: grn.poId } });
    if (!po) return null;

    const unitRate = grnItem?.landedCostPerUnit || grnItem?.unitPrice || 0;
    const totalAmount = Math.round(params.rejectedQty * unitRate * 100) / 100;

    const debitNoteNumber = await this.generateNumber(user.companyId, tx);
    const debitNote = await tx.debitNote.create({
      data: {
        companyId: user.companyId,
        debitNoteNumber,
        vendorId: po.vendorId,
        poId: po.id,
        grnId: grn.id,
        gateInwardEntryId: grn.gateInwardEntryId ?? undefined,
        iqcId: iqc.id,
        iqcItemId: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        rejectedQty: params.rejectedQty,
        unitRate,
        totalAmount,
        reason: params.rejectionReason ?? item.rejectionReason ?? undefined,
        remarks: `Auto-generated on final IQC rejection ${iqc.iqcNumber} - deviation declined, material returned to vendor`,
        status: 'ISSUED',
        issuedAt: new Date(),
        createdBy: user.id, updatedBy: user.id,
      },
    });

    return debitNote;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, vendorId, status, fromDate, toDate } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;
    if (search) where.OR = [
      { debitNoteNumber: { contains: search, mode: 'insensitive' } },
      { itemCode: { contains: search, mode: 'insensitive' } },
    ];
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.debitNote.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: this.includes(),
      }),
      this.prisma.debitNote.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findByVendor(vendorId: string, user: any) {
    return this.prisma.debitNote.findMany({
      where: { companyId: user.companyId, vendorId },
      orderBy: { createdAt: 'desc' },
      include: this.includes(),
    });
  }

  async findOne(id: string, user: any) {
    const note = await this.prisma.debitNote.findFirst({
      where: { id, companyId: user.companyId },
      include: this.includes(),
    });
    if (!note) throw new NotFoundException('Debit note not found');
    return note;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, issued, settled] = await Promise.all([
      this.prisma.debitNote.count({ where }),
      this.prisma.debitNote.count({ where: { ...where, status: 'ISSUED' } }),
      this.prisma.debitNote.count({ where: { ...where, status: 'SETTLED' } }),
    ]);
    const totalValue = await this.prisma.debitNote.aggregate({ where, _sum: { totalAmount: true } });
    const outstandingValue = await this.prisma.debitNote.aggregate({
      where: { ...where, status: { in: ['DRAFT', 'ISSUED'] } }, _sum: { totalAmount: true },
    });
    return {
      total, issued, settled,
      totalValue: totalValue._sum.totalAmount || 0,
      outstandingValue: outstandingValue._sum.totalAmount || 0,
    };
  }

  // Keeping settlement deliberately simple - a status transition only,
  // no reconciliation against a specific AP bill/payment. That ledger
  // tie-up doesn't exist yet for vendor payables in this codebase (AP
  // only tracks acceptedQty-based bills - see ApService) and building
  // it is out of scope for this feature.
  async updateStatus(id: string, dto: UpdateDebitNoteStatusDto, user: any) {
    const note = await this.prisma.debitNote.findFirst({ where: { id, companyId: user.companyId } });
    if (!note) throw new NotFoundException('Debit note not found');
    if (note.status === 'CANCELLED' || note.status === 'SETTLED') {
      throw new BadRequestException(`Debit note is already ${note.status} and cannot be changed further`);
    }

    const updated = await this.prisma.debitNote.update({
      where: { id },
      data: { status: dto.status, remarks: dto.remarks ?? note.remarks, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'debit_notes', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }
}
