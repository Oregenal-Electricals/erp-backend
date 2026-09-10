import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RaiseDiscrepancyDto, CorrectDiscrepancyDto } from './dto/grn-discrepancy.dto';

// STORE-005: problem types the spec names as needing technical QC
// assessment (damage may still be usable, spec mismatch may be a real
// deviation) rather than a Store-level basic check Store itself can
// resolve (wrong material, batch, label, document, UOM mismatches are
// identity/paperwork problems, not quality judgments).
const QC_REQUIRED_PROBLEM_TYPES = ['VISIBLE_DAMAGE', 'SPECIFICATION_MISMATCH'];

@Injectable()
export class GrnDiscrepancyService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.grnItemDiscrepancy.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `DIS-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private includes() {
    return {
      grnItem: { select: { itemCode: true, itemName: true, uom: true, receivedQty: true, heldQty: true } },
      grn: { select: { grnNumber: true, warehouseId: true, warehouse: { select: { name: true } } } },
      raisedBy: { select: { firstName: true, lastName: true } },
      resolvedBy: { select: { firstName: true, lastName: true } },
    };
  }

  // Section 19-20: discrepancies belong to Store's own receiving/physical
  // verification stage, before IQC ever sees the line - so the GRN must
  // still be DRAFT. A GRN already sent to IQC means this window has
  // closed; anything found from that point on is a different (QC-side)
  // process, not STORE-005.
  //
  // Section 17: affected qty can never exceed what's still "applicable"
  // on the line - i.e. what hasn't already been claimed by an earlier
  // discrepancy on the same line (heldQty), preventing the same physical
  // units from being flagged twice (section 49, no double hold).
  async raise(grnItemId: string, dto: RaiseDiscrepancyDto, user: any) {
    const grnItem = await this.prisma.grnItem.findFirst({
      where: { id: grnItemId, companyId: user.companyId },
      include: { grn: { include: { po: { select: { vendor: { select: { name: true } } } } }, } },
    });
    if (!grnItem) throw new NotFoundException('GRN item not found');
    const grn = (grnItem as any).grn;
    if (grn.status !== 'DRAFT') throw new BadRequestException('Discrepancies can only be raised while the GRN is still DRAFT - before IQC has taken over the line');

    const applicableQty = grnItem.receivedQty - grnItem.heldQty;
    if (dto.affectedQty > applicableQty) {
      throw new BadRequestException(`Affected qty (${dto.affectedQty}) exceeds the physically applicable quantity still available on this line (${applicableQty})`);
    }

    const discrepancyNumber = await this.generateNumber(user.companyId);
    const qcStatus = QC_REQUIRED_PROBLEM_TYPES.includes(dto.problemType) ? 'PENDING' : 'NOT_REQUIRED';
    const supplierName = grn.po?.vendor?.name || '';

    const [record] = await this.prisma.$transaction([
      this.prisma.grnItemDiscrepancy.create({
        data: {
          companyId: user.companyId, discrepancyNumber,
          grnItemId, grnId: grn.id, gateInwardEntryId: grn.gateInwardEntryId, poId: grn.poId,
          supplierName, itemCode: grnItem.itemCode, itemName: grnItem.itemName, uom: grnItem.uom,
          physicalItemCode: dto.physicalItemCode, physicalItemName: dto.physicalItemName,
          physicalSpecification: dto.physicalSpecification, physicalBatch: dto.physicalBatch,
          affectedQty: dto.affectedQty, problemType: dto.problemType, damageType: dto.damageType,
          reason: dto.reason, evidence: dto.evidence as any,
          qcStatus, status: 'OPEN',
          raisedById: user.id, createdBy: user.id, updatedBy: user.id,
        },
        include: this.includes(),
      }),
      this.prisma.grnItem.update({
        where: { id: grnItemId },
        data: { heldQty: { increment: dto.affectedQty }, updatedBy: user.id },
      }),
    ]);

    const purchaseUsers = await this.prisma.user.findMany({
      where: { companyId: user.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'SUPER_ADMIN'] } },
      select: { id: true },
    });
    if (purchaseUsers.length > 0) {
      await this.notifications.createBulk(
        purchaseUsers.map(u => ({
          userId: u.id,
          type: 'STORE_DISCREPANCY_RAISED',
          title: 'Material discrepancy raised at Store',
          message: record.discrepancyNumber + ' - ' + supplierName + ' - ' + record.itemName + ': ' + record.problemType + ', affected ' + record.affectedQty + ' ' + record.uom + '.',
          referenceType: 'GRN_ITEM_DISCREPANCY', referenceId: record.id, referenceNumber: record.discrepancyNumber,
          priority: 'HIGH',
        })) as any,
        user.companyId, user.id,
      );
    }
    const withNotified = await this.prisma.grnItemDiscrepancy.update({
      where: { id: record.id },
      data: { purchaseNotifiedAt: new Date(), purchaseStatus: 'NOTIFIED' },
      include: this.includes(),
    });

    await this.audit.log({
      tableName: 'grn_item_discrepancies', recordId: record.id, action: 'CREATE',
      newValues: { itemCode: record.itemCode, problemType: record.problemType, affectedQty: record.affectedQty, qcStatus },
      changedBy: user.id,
    });

    return withNotified;
  }

  async findAll(user: any, query: any) {
    const page = parseInt(query?.page) || 1;
    const limit = parseInt(query?.limit) || 20;
    const where: any = { companyId: user.companyId, isActive: true };
    if (query?.status) where.status = query.status;
    if (query?.grnId) where.grnId = query.grnId;
    const [data, total] = await Promise.all([
      this.prisma.grnItemDiscrepancy.findMany({ where, include: this.includes(), orderBy: { raisedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.grnItemDiscrepancy.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: any) {
    const r = await this.prisma.grnItemDiscrepancy.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!r) throw new NotFoundException('Discrepancy record not found');
    return r;
  }

  // Section 38-40: Store may correct an obvious miscount before
  // downstream processing (e.g. recounted 18 damaged, not the 20
  // originally flagged) - but once QC has actually inspected the held
  // quantity (qcStatus ACCEPTED/REJECTED), the affected qty is frozen;
  // a real change past that point needs a controlled reconciliation,
  // not a silent edit that would retroactively shift what QC already
  // signed off on.
  async correct(id: string, dto: CorrectDiscrepancyDto, user: any) {
    const record = await this.prisma.grnItemDiscrepancy.findFirst({ where: { id, companyId: user.companyId } });
    if (!record) throw new NotFoundException('Discrepancy record not found');
    if (['ACCEPTED', 'REJECTED'].includes(record.qcStatus)) {
      throw new BadRequestException('This discrepancy has already been inspected by QC - the affected quantity cannot be directly edited. Use a controlled reconciliation instead.');
    }

    const grnItem = await this.prisma.grnItem.findFirst({ where: { id: record.grnItemId } });
    if (!grnItem) throw new NotFoundException('GRN item not found');

    const delta = dto.affectedQty - record.affectedQty;
    const newHeldQty = grnItem.heldQty + delta;
    if (newHeldQty < 0 || dto.affectedQty > (grnItem.receivedQty - grnItem.heldQty + record.affectedQty)) {
      throw new BadRequestException('Corrected affected qty is invalid against the physically applicable quantity on this line');
    }

    const oldValues = { affectedQty: record.affectedQty };
    const [updated] = await this.prisma.$transaction([
      this.prisma.grnItemDiscrepancy.update({
        where: { id }, data: { affectedQty: dto.affectedQty, remarks: dto.reason, updatedBy: user.id },
        include: this.includes(),
      }),
      this.prisma.grnItem.update({ where: { id: record.grnItemId }, data: { heldQty: newHeldQty, updatedBy: user.id } }),
    ]);

    await this.audit.log({
      tableName: 'grn_item_discrepancies', recordId: id, action: 'UPDATE',
      oldValues, newValues: { affectedQty: dto.affectedQty, reason: dto.reason },
      changedBy: user.id,
    });

    return updated;
  }
}
