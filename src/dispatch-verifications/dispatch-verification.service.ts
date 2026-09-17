import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class DispatchVerificationService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.dispatchVerification.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `DV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      pickList: { select: { pickListNumber: true } },
      salesOrder: { select: { soNumber: true, customerName: true } },
      items: true,
    };
  }

  // DSP-007 section 5-6: originates only from actual Picked quantity
  // on a real Pick List - never from raw reservation or plan demand.
  async createVerification(pickListId: string, user: any) {
    const pickList = await this.prisma.pickList.findFirst({ where: { id: pickListId, companyId: user.companyId } });
    if (!pickList) throw new NotFoundException('Pick List not found');
    if (pickList.status === 'CANCELLED') throw new BadRequestException('This Pick List is cancelled');
    if (pickList.status === 'CREATED') throw new BadRequestException('This Pick List has no picked quantity yet');

    const verificationNumber = await this.generateNumber(user.companyId);
    const verification = await this.prisma.dispatchVerification.create({
      data: {
        verificationNumber, pickListId, soId: pickList.soId, customerName: pickList.customerName,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'dispatch_verifications', recordId: verification.id, action: 'CREATE', newValues: verification, changedBy: user.id });
    return verification;
  }

  // DSP-007 sections 22, 44-45: verified is a nested subset of picked
  // - the ceiling is pickedQty minus pick-reversedQty minus already-
  // verified-net-of-reversed on THIS pick event, never a second,
  // independent claim on top of the pick.
  private async remainingToVerify(pickListItemId: string, pickedQty: number, pickReversedQty: number) {
    const agg = await this.prisma.dispatchVerificationItem.aggregate({
      where: { pickListItemId, isActive: true },
      _sum: { verifiedQty: true, reversedQty: true },
    });
    const netVerified = (agg._sum.verifiedQty || 0) - (agg._sum.reversedQty || 0);
    return Math.max(pickedQty - pickReversedQty - netVerified, 0);
  }

  // DSP-007 sections 10, 13, 28, 34-40, 96: revalidates CURRENT
  // quality/status fresh at verification time - a DSP-006 pick does
  // not override a Hold/Reject that happened afterward. This is a
  // read-only gate: dispatch verification never itself changes a QC
  // or stage status, it only checks it.
  private async revalidateQuality(pickListItem: any): Promise<{ ok: boolean; reason?: string }> {
    if (pickListItem.batchId) {
      const batch = await this.prisma.stockBatch.findUnique({ where: { id: pickListItem.batchId } });
      if (!batch || batch.status !== 'ACTIVE') {
        const reason = !batch ? 'BLOCKED_STOCK' : batch.status === 'EXPIRED' ? 'BLOCKED_STOCK' : batch.status === 'QUARANTINED' ? 'QC_HOLD' : 'BLOCKED_STOCK';
        return { ok: false, reason };
      }
    } else if (pickListItem.saleType === 'SFG') {
      const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } });
      if (reservation?.workOrderId) {
        const wo = await this.prisma.workOrder.findUnique({ where: { id: reservation.workOrderId } });
        if (!wo || wo.stageStatus === 'BLOCKED') return { ok: false, reason: 'STAGE_MISMATCH' };
      }
    }
    return { ok: true };
  }

  async verifyItem(verificationId: string, pickListItemId: string, verifiedQty: number, user: any) {
    const verification = await this.prisma.dispatchVerification.findFirst({ where: { id: verificationId, companyId: user.companyId } });
    if (!verification) throw new NotFoundException('Verification not found');
    if (verification.status === 'CANCELLED') throw new BadRequestException('This Verification is cancelled');

    const pickListItem = await this.prisma.pickListItem.findFirst({
      where: { id: pickListItemId, isActive: true, pickListId: verification.pickListId },
    });
    if (!pickListItem) throw new NotFoundException('Pick event not found on this Pick List');
    if (pickListItem.status === 'REVERSED') throw new BadRequestException('This pick has been fully reversed and cannot be verified');

    const quality = await this.revalidateQuality(pickListItem);

    const remaining = await this.remainingToVerify(pickListItemId, pickListItem.pickedQty, pickListItem.reversedQty);
    if (verifiedQty > remaining) {
      throw new BadRequestException(`Verify qty ${verifiedQty} exceeds what remains to verify on this pick (${remaining}).`);
    }

    const item = await this.prisma.dispatchVerificationItem.create({
      data: {
        verificationId, pickListItemId, soItemId: pickListItem.soItemId, itemCode: pickListItem.itemCode, itemName: pickListItem.itemName,
        saleType: pickListItem.saleType,
        verifiedQty: quality.ok ? verifiedQty : 0,
        exceptionQty: quality.ok ? 0 : verifiedQty,
        exceptionReason: quality.ok ? null : quality.reason,
        status: quality.ok ? 'VERIFIED' : 'EXCEPTION',
        createdBy: user.id, updatedBy: user.id,
      },
    });

    await this.refreshVerificationStatus(verificationId, user);

    await this.audit.log({
      tableName: 'dispatch_verification_items', recordId: item.id, action: 'CREATE',
      newValues: { verificationId, pickListItemId, requestedQty: verifiedQty, result: quality },
      changedBy: user.id,
    });

    if (!quality.ok) {
      throw new BadRequestException(`Verification blocked: ${quality.reason} - current quality status no longer eligible.`);
    }
    return item;
  }

  private async refreshVerificationStatus(verificationId: string, user: any) {
    const items = await this.prisma.dispatchVerificationItem.findMany({ where: { verificationId, isActive: true } });
    const pickItemIds = [...new Set(items.map(i => i.pickListItemId))];
    const pickItems = await this.prisma.pickListItem.findMany({ where: { id: { in: pickItemIds } } });
    const totalPicked = pickItems.reduce((s, p) => s + (p.pickedQty - p.reversedQty), 0);
    const totalVerified = items.reduce((s, i) => s + (i.verifiedQty - i.reversedQty), 0);
    const hasException = items.some(i => i.status === 'EXCEPTION');
    const status = hasException && totalVerified <= 0.0001 ? 'EXCEPTION'
      : totalVerified <= 0.0001 ? 'PENDING'
      : totalVerified >= totalPicked - 0.0001 ? (hasException ? 'PARTIALLY_VERIFIED' : 'VERIFIED')
      : 'PARTIALLY_VERIFIED';
    await this.prisma.dispatchVerification.update({ where: { id: verificationId }, data: { status, updatedBy: user.id } });
  }

  // DSP-007 sections 53-54: reversal returns quantity to
  // Picked-but-not-Verified state only - it never touches the Pick,
  // the Reservation, or the Sales Order.
  async reverseVerification(verificationItemId: string, reverseQty: number, reason: string | undefined, user: any) {
    const item = await this.prisma.dispatchVerificationItem.findFirst({
      where: { id: verificationItemId, isActive: true, verification: { companyId: user.companyId } },
    });
    if (!item) throw new NotFoundException('Verification event not found');
    const stillVerified = item.verifiedQty - item.reversedQty;
    if (reverseQty > stillVerified) throw new BadRequestException(`Cannot reverse ${reverseQty} - only ${stillVerified} is currently verified.`);

    const newReversedQty = item.reversedQty + reverseQty;
    const updated = await this.prisma.dispatchVerificationItem.update({
      where: { id: item.id },
      data: { reversedQty: newReversedQty, status: newReversedQty >= item.verifiedQty - 0.0001 ? 'REVERSED' : 'VERIFIED', reason, updatedBy: user.id },
    });
    await this.refreshVerificationStatus(item.verificationId, user);
    await this.audit.log({ tableName: 'dispatch_verification_items', recordId: item.id, action: 'UPDATE', newValues: { reversedQty: newReversedQty, reason }, changedBy: user.id });
    return updated;
  }

  async findOne(id: string, user: any) {
    const verification = await this.prisma.dispatchVerification.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!verification) throw new NotFoundException('Verification not found');
    return verification;
  }
}
