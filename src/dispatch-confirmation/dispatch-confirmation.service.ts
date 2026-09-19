import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { DispatchDocumentReadinessService } from '../dispatch-document-readiness/dispatch-document-readiness.service';

@Injectable()
export class DispatchConfirmationService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private readiness: DispatchDocumentReadinessService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.dispatchConfirmation.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `DC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      loading: { select: { loadingNumber: true } },
      transportAssignment: { select: { assignmentNumber: true, vehicleNumber: true, transporterName: true } },
      dispatchPlan: { select: { planNumber: true } },
      salesOrder: { select: { soNumber: true, customerName: true } },
      packages: { include: { items: true } },
      items: true,
    };
  }

  // DSP-012 sections 8-9: normal confirmation can only originate from
  // valid DSP-011 Loaded quantity - never packed-but-not-loaded,
  // unverified, or unreserved stock.
  async createConfirmation(loadingId: string, user: any) {
    const loading = await this.prisma.dispatchLoading.findFirst({
      where: { id: loadingId, companyId: user.companyId },
      include: { items: { where: { isActive: true, status: 'LOADED' } } },
    });
    if (!loading) throw new NotFoundException('Loading not found');
    if (loading.items.length === 0) throw new BadRequestException('This Loading has no valid loaded packages to confirm');

    const confirmationNumber = await this.generateNumber(user.companyId);
    const confirmation = await this.prisma.dispatchConfirmation.create({
      data: {
        confirmationNumber, loadingId, transportAssignmentId: loading.transportAssignmentId,
        dispatchPlanId: loading.dispatchPlanId, soId: loading.soId, customerName: loading.customerName,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'dispatch_confirmations', recordId: confirmation.id, action: 'CREATE', newValues: confirmation, changedBy: user.id });
    return confirmation;
  }

  // DSP-012 sections 27-29: mirrors DSP-007/008/011's exact quality
  // gate - Dispatch never changes a HOLD/REJECTED status, only
  // checks it fresh at confirmation time.
  private async revalidatePackageQuality(pkg: any): Promise<{ ok: boolean; reason?: string }> {
    for (const item of pkg.items) {
      const verificationItem = await this.prisma.dispatchVerificationItem.findUnique({ where: { id: item.verificationItemId } });
      if (!verificationItem) continue;
      const pickListItem = await this.prisma.pickListItem.findUnique({ where: { id: verificationItem.pickListItemId } });
      if (!pickListItem) continue;
      if (pickListItem.batchId) {
        const batch = await this.prisma.stockBatch.findUnique({ where: { id: pickListItem.batchId } });
        if (!batch || batch.status !== 'ACTIVE') return { ok: false, reason: batch?.status === 'QUARANTINED' ? 'QUALITY_HOLD' : 'BLOCKED_STOCK' };
      } else if (verificationItem.saleType === 'SFG') {
        const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } });
        if (reservation?.workOrderId) {
          const wo = await this.prisma.workOrder.findUnique({ where: { id: reservation.workOrderId } });
          if (!wo || wo.stageStatus === 'BLOCKED') return { ok: false, reason: 'STAGE_MISMATCH' };
        }
      }
    }
    return { ok: true };
  }

  // DSP-012 sections 19, 30-31, 47, 78: package-based atomic claim
  // (same conditional-UPDATE pattern as every claim in this chain),
  // preceded by BOTH a fresh quality revalidation AND a fresh,
  // never-cached DSP-009 document-readiness check - never trusts an
  // old READY flag.
  async confirmPackage(confirmationId: string, packageId: string, user: any) {
    const confirmation = await this.prisma.dispatchConfirmation.findFirst({ where: { id: confirmationId, companyId: user.companyId } });
    if (!confirmation) throw new NotFoundException('Confirmation not found');
    if (!['PENDING_CONFIRMATION', 'PARTIALLY_CONFIRMED'].includes(confirmation.status)) {
      throw new BadRequestException(`This Confirmation is ${confirmation.status} and not open for confirmation`);
    }

    const pkg = await this.prisma.dispatchPackage.findFirst({
      where: { id: packageId, isActive: true, status: 'ACTIVE', loadedInLoadingId: confirmation.loadingId },
      include: { items: true },
    });
    if (!pkg) throw new NotFoundException('Package not found, not Active, or not loaded under this Loading');

    const quality = await this.revalidatePackageQuality(pkg);
    const docReadiness = await this.readiness.checkReadiness(confirmation.dispatchPlanId, user);
    const documentsOk = docReadiness.overall === 'DOCUMENTS_READY';

    if (!quality.ok || !documentsOk) {
      const reason = !quality.ok ? quality.reason : `DOCUMENTS_${docReadiness.overall}`;
      await this.prisma.dispatchConfirmationItem.create({
        data: { confirmationId, packageId, status: 'EXCEPTION', exceptionReason: reason, confirmedBy: user.id, createdBy: user.id, updatedBy: user.id },
      });
      throw new BadRequestException(`Confirmation blocked: ${reason} - not eligible for Gate-Out readiness.`);
    }

    const claim: number = await this.prisma.$executeRaw`
      UPDATE dispatch_packages SET "confirmedInConfirmationId" = ${confirmationId}, "updatedBy" = ${user.id}
      WHERE id = ${packageId} AND "confirmedInConfirmationId" IS NULL
    `;
    if (claim === 0) throw new BadRequestException('This package is already confirmed (duplicate confirmation blocked)');

    const item = await this.prisma.dispatchConfirmationItem.create({
      data: { confirmationId, packageId, status: 'CONFIRMED', confirmedBy: user.id, createdBy: user.id, updatedBy: user.id },
    });

    await this.refreshConfirmationStatus(confirmationId, user);
    await this.audit.log({ tableName: 'dispatch_confirmation_items', recordId: item.id, action: 'CREATE', newValues: { confirmationId, packageId }, changedBy: user.id });
    return item;
  }

  // DSP-012 sections 11-13: PARTIAL/FULL is derived from the actual
  // loaded-vs-confirmed package counts on THIS loading - never
  // manually typed by a user.
  private async refreshConfirmationStatus(confirmationId: string, user: any) {
    const confirmation = await this.prisma.dispatchConfirmation.findUnique({
      where: { id: confirmationId },
      include: { loading: { include: { items: { where: { isActive: true, status: 'LOADED' } } } }, items: true },
    });
    if (!confirmation) return;
    const loadedCount = confirmation.loading.items.length;
    const confirmedCount = confirmation.items.filter((i: any) => i.isActive && i.status === 'CONFIRMED').length;
    if (confirmedCount === 0) return;
    const status = confirmedCount >= loadedCount ? 'READY_FOR_GATE_OUT' : 'PARTIALLY_CONFIRMED';
    const confirmationType = confirmedCount >= loadedCount ? 'FULL' : 'PARTIAL';
    if (confirmation.status !== 'CANCELLED') {
      await this.prisma.dispatchConfirmation.update({
        where: { id: confirmationId },
        data: { status, confirmationType, confirmedAt: new Date(), confirmedBy: user.id, updatedBy: user.id },
      });
    }
  }

  // DSP-012 sections 55-60: reversal before Gate-Out only, returns
  // the package to Loaded-but-not-Confirmed - never unloads (DSP-011
  // owns that), never releases reservation, never touches Sales
  // Order.
  async reverseConfirmationItem(itemId: string, reason: string | undefined, user: any) {
    const item = await this.prisma.dispatchConfirmationItem.findFirst({ where: { id: itemId, isActive: true, confirmation: { companyId: user.companyId } } });
    if (!item) throw new NotFoundException('Confirmation event not found');
    if (item.status !== 'CONFIRMED') throw new BadRequestException(`This item is ${item.status}, not currently confirmed`);

    // DSP-013 section 65: once physically Gated-Out, simple DSP-012 reversal is blocked.
    const pkgForReversal = await this.prisma.dispatchPackage.findUnique({ where: { id: item.packageId } });
    if (pkgForReversal?.gateOutId) throw new BadRequestException('This package has already been Gated-Out - simple confirmation reversal is no longer permitted');

    await this.prisma.dispatchPackage.updateMany({ where: { id: item.packageId, confirmedInConfirmationId: item.confirmationId }, data: { confirmedInConfirmationId: null } });
    const updated = await this.prisma.dispatchConfirmationItem.update({
      where: { id: item.id },
      data: { status: 'REVERSED', reversedBy: user.id, reversedAt: new Date(), reason, updatedBy: user.id },
    });
    await this.refreshConfirmationStatus(item.confirmationId, user);
    await this.audit.log({ tableName: 'dispatch_confirmation_items', recordId: item.id, action: 'UPDATE', newValues: { status: 'REVERSED', reason }, changedBy: user.id });
    return updated;
  }

  async findOne(id: string, user: any) {
    const confirmation = await this.prisma.dispatchConfirmation.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!confirmation) throw new NotFoundException('Confirmation not found');
    return confirmation;
  }
}
