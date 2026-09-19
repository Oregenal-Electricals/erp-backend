import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class DispatchLoadingService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.dispatchLoading.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `LD-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      transportAssignment: { select: { assignmentNumber: true, vehicleNumber: true, transporterName: true } },
      dispatchPlan: { select: { planNumber: true } },
      salesOrder: { select: { soNumber: true, customerName: true } },
      packages: { include: { items: true } },
      items: true,
    };
  }

  // DSP-011 sections 8-9: physical vehicle must match the confirmed
  // DSP-010 assignment before any loading begins - never silently
  // overwritten to a different vehicle.
  private checkVehicleMatch(assignment: any, actualVehicleNumber?: string) {
    if (actualVehicleNumber && assignment.vehicleNumber && actualVehicleNumber !== assignment.vehicleNumber) {
      throw new BadRequestException(`Vehicle mismatch: assigned ${assignment.vehicleNumber}, actual ${actualVehicleNumber}. Loading blocked pending controlled reassignment.`);
    }
  }

  async startLoading(transportAssignmentId: string, actualVehicleNumber: string | undefined, user: any) {
    const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: transportAssignmentId, companyId: user.companyId } });
    if (!assignment) throw new NotFoundException('Transport Assignment not found');
    if (assignment.status !== 'ASSIGNED') throw new BadRequestException('This Transport Assignment must be confirmed (ASSIGNED) before loading can start');
    this.checkVehicleMatch(assignment, actualVehicleNumber);

    const loadingNumber = await this.generateNumber(user.companyId);
    const loading = await this.prisma.dispatchLoading.create({
      data: {
        loadingNumber, transportAssignmentId, dispatchPlanId: assignment.dispatchPlanId, soId: assignment.soId, customerName: assignment.customerName,
        status: 'IN_PROGRESS', startedAt: new Date(), startedBy: user.id,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'dispatch_loadings', recordId: loading.id, action: 'CREATE', newValues: loading, changedBy: user.id });
    return loading;
  }

  // DSP-011 sections 25-26, 46: revalidates CURRENT quality/status
  // fresh at load time, mirroring DSP-007/008's own quality gate -
  // never a second, independent QC concept.
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

  // DSP-011 sections 13-16, 63, 96: package-based atomic claim - the
  // exact same conditional-UPDATE pattern used for the DSP-010
  // package-to-vehicle claim, applied one level further (vehicle to
  // loading). A package already loaded, or belonging to a different
  // vehicle/dispatch, is rejected before any write.
  async loadPackage(loadingId: string, packageId: string, actualVehicleNumber: string | undefined, user: any) {
    const loading = await this.prisma.dispatchLoading.findFirst({ where: { id: loadingId, companyId: user.companyId }, include: { transportAssignment: true } });
    if (!loading) throw new NotFoundException('Loading not found');
    if (!['DRAFT', 'IN_PROGRESS', 'PARTIALLY_LOADED'].includes(loading.status)) throw new BadRequestException(`This Loading is ${loading.status} and not open for loading`);
    this.checkVehicleMatch(loading.transportAssignment, actualVehicleNumber);

    const pkg = await this.prisma.dispatchPackage.findFirst({
      where: { id: packageId, isActive: true, status: 'ACTIVE', assignedTransportAssignmentId: loading.transportAssignmentId },
      include: { items: true },
    });
    if (!pkg) throw new NotFoundException('Package not found, not Active, or not assigned to this vehicle/Dispatch');

    const quality = await this.revalidatePackageQuality(pkg);
    if (!quality.ok) {
      await this.prisma.dispatchLoadingItem.create({
        data: { loadingId, packageId, status: 'EXCEPTION', exceptionReason: quality.reason, loadedBy: user.id, createdBy: user.id, updatedBy: user.id },
      });
      throw new BadRequestException(`Loading blocked: ${quality.reason} - current quality status no longer eligible for loading.`);
    }

    const claim: number = await this.prisma.$executeRaw`
      UPDATE dispatch_packages SET "loadedInLoadingId" = ${loadingId}, "updatedBy" = ${user.id}
      WHERE id = ${packageId} AND "loadedInLoadingId" IS NULL
    `;
    if (claim === 0) throw new BadRequestException('This package is already loaded (duplicate scan blocked)');

    const item = await this.prisma.dispatchLoadingItem.create({
      data: { loadingId, packageId, status: 'LOADED', loadedBy: user.id, createdBy: user.id, updatedBy: user.id },
    });

    await this.refreshLoadingStatus(loadingId, user);
    await this.audit.log({ tableName: 'dispatch_loading_items', recordId: item.id, action: 'CREATE', newValues: { loadingId, packageId }, changedBy: user.id });
    return item;
  }

  private async refreshLoadingStatus(loadingId: string, user: any) {
    const loading = await this.prisma.dispatchLoading.findUnique({ where: { id: loadingId }, include: { transportAssignment: { include: { packages: true } }, items: true } });
    if (!loading) return;
    const assignedCount = loading.transportAssignment.packages.length;
    const loadedCount = loading.items.filter((i: any) => i.isActive && i.status === 'LOADED').length;
    const status = loadedCount === 0 ? 'IN_PROGRESS' : loadedCount >= assignedCount ? 'PARTIALLY_LOADED' : 'PARTIALLY_LOADED';
    // Note: COMPLETE is only ever set explicitly via completeLoading() - never auto-inferred (section 47).
    if (loading.status !== 'COMPLETE') {
      await this.prisma.dispatchLoading.update({ where: { id: loadingId }, data: { status, updatedBy: user.id } });
    }
  }

  // DSP-011 sections 41-45: unload returns the package to Dispatch
  // Staging - it never unpacks (DSP-008), releases reservation
  // (DSP-005), or reverses picking/verification. Only the loading
  // claim itself is reversed.
  async unloadPackage(loadingItemId: string, reason: string | undefined, user: any) {
    const item = await this.prisma.dispatchLoadingItem.findFirst({ where: { id: loadingItemId, isActive: true, loading: { companyId: user.companyId } } });
    if (!item) throw new NotFoundException('Loading event not found');
    if (item.status !== 'LOADED') throw new BadRequestException(`This item is ${item.status}, not currently loaded`);

    // DSP-013 section 63: once physically Gated-Out, simple unload is blocked.
    const pkgForUnload = await this.prisma.dispatchPackage.findUnique({ where: { id: item.packageId } });
    if (pkgForUnload?.gateOutId) throw new BadRequestException('This package has already been Gated-Out - simple unload is no longer permitted');

    await this.prisma.dispatchPackage.updateMany({ where: { id: item.packageId, loadedInLoadingId: item.loadingId }, data: { loadedInLoadingId: null } });
    const updated = await this.prisma.dispatchLoadingItem.update({
      where: { id: item.id },
      data: { status: 'UNLOADED', unloadedBy: user.id, unloadedAt: new Date(), reason, updatedBy: user.id },
    });
    await this.refreshLoadingStatus(item.loadingId, user);
    await this.audit.log({ tableName: 'dispatch_loading_items', recordId: item.id, action: 'UPDATE', newValues: { status: 'UNLOADED', reason }, changedBy: user.id });
    return updated;
  }

  // DSP-011 section 47: completion is an explicit, authorized action
  // - never auto-triggered by reaching 100% - so an intentionally
  // partial dispatch can still be marked complete for what it is.
  async completeLoading(loadingId: string, user: any) {
    const loading = await this.prisma.dispatchLoading.findFirst({ where: { id: loadingId, companyId: user.companyId }, include: { items: true } });
    if (!loading) throw new NotFoundException('Loading not found');
    const loadedCount = loading.items.filter((i: any) => i.isActive && i.status === 'LOADED').length;
    if (loadedCount === 0) throw new BadRequestException('Load at least one package before completing');
    const updated = await this.prisma.dispatchLoading.update({
      where: { id: loadingId }, data: { status: 'COMPLETE', completedAt: new Date(), completedBy: user.id, updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'dispatch_loadings', recordId: loadingId, action: 'UPDATE', newValues: { status: 'COMPLETE' }, changedBy: user.id });
    return updated;
  }

  async findOne(id: string, user: any) {
    const loading = await this.prisma.dispatchLoading.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!loading) throw new NotFoundException('Loading not found');
    return loading;
  }
}
