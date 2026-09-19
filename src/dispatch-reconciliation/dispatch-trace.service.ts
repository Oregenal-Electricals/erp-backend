import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispatchTraceService {
  constructor(private prisma: PrismaService) {}

  // DSP-014 sections 53-58, 113: one timeline instead of many
  // modules. RM/FG trace forward from batch; SFG traces forward from
  // WO+Stage (section 57). Every reference here is read, never
  // rewritten by later master changes (section 72), since each row
  // already carries its own historical snapshot fields from the
  // module that created it.
  async tracePackage(packageId: string, user: any) {
    const pkg = await this.prisma.dispatchPackage.findFirst({
      where: { id: packageId, isActive: true },
      include: {
        items: true,
        packing: { include: { verification: { include: { pickList: { include: { dispatchPlan: { include: { salesOrder: true } } } } } } } },
        assignedTransportAssignment: true,
        loadedInLoading: true,
        confirmedInConfirmation: true,
        gateOut: true,
      },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    if (pkg.packing.verification.pickList.dispatchPlan.salesOrder.companyId !== user.companyId) throw new NotFoundException('Package not found');

    const plan = pkg.packing.verification.pickList.dispatchPlan;
    const so = plan.salesOrder;

    const timeline: any[] = [
      { stage: 'SALES_ORDER', ref: so.soNumber, at: so.createdAt },
      { stage: 'DISPATCH_PLAN', ref: plan.planNumber, at: plan.createdAt },
      { stage: 'PICK_LIST', ref: pkg.packing.verification.pickList.pickListNumber, at: pkg.packing.verification.pickList.createdAt },
      { stage: 'VERIFICATION', ref: pkg.packing.verification.verificationNumber, at: pkg.packing.verification.createdAt },
      { stage: 'PACKING', ref: pkg.packing.packingNumber, packageNumber: pkg.packageNumber, at: pkg.createdAt },
    ];
    if (pkg.assignedTransportAssignment) timeline.push({ stage: 'TRANSPORT_ASSIGNMENT', ref: pkg.assignedTransportAssignment.assignmentNumber, vehicleNumber: pkg.assignedTransportAssignment.vehicleNumber, at: pkg.assignedTransportAssignment.createdAt });
    if (pkg.loadedInLoading) timeline.push({ stage: 'LOADING', ref: pkg.loadedInLoading.loadingNumber, at: pkg.loadedInLoading.createdAt });
    if (pkg.confirmedInConfirmation) timeline.push({ stage: 'DISPATCH_CONFIRMATION', ref: pkg.confirmedInConfirmation.confirmationNumber, at: pkg.confirmedInConfirmation.createdAt });
    if (pkg.gateOut) timeline.push({ stage: 'GATE_OUT', ref: pkg.gateOut.gateOutNumber, vehicleNumber: pkg.gateOut.vehicleNumber, at: pkg.gateOut.gateOutAt });

    // Backward source trace per item: RM -> batch; SFG -> WO/Stage.
    const sourceTrace = await Promise.all(pkg.items.map(async (item: any) => {
      const verificationItem = await this.prisma.dispatchVerificationItem.findUnique({ where: { id: item.verificationItemId } });
      if (!verificationItem) return null;
      const pickListItem = await this.prisma.pickListItem.findUnique({ where: { id: verificationItem.pickListItemId } });
      if (!pickListItem) return null;
      if (pickListItem.batchId) {
        const batch = await this.prisma.stockBatch.findUnique({ where: { id: pickListItem.batchId } });
        return { itemCode: verificationItem.itemCode, saleType: verificationItem.saleType, source: 'BATCH', batchNumber: batch?.batchNumber };
      }
      if (verificationItem.saleType === 'SFG') {
        const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } });
        if (reservation?.workOrderId) {
          const wo = await this.prisma.workOrder.findUnique({ where: { id: reservation.workOrderId } });
          return { itemCode: verificationItem.itemCode, saleType: 'SFG', source: 'WORK_ORDER', workOrderNumber: wo?.woNumber, stageName: wo?.stageName };
        }
      }
      return { itemCode: verificationItem.itemCode, saleType: verificationItem.saleType, source: 'UNTRACKED' };
    }));

    return {
      packageId, packageNumber: pkg.packageNumber, currentStatus: pkg.status,
      timeline: timeline.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
      sourceTrace: sourceTrace.filter(Boolean),
    };
  }

  async trace(query: { packageNumber?: string; gateOutNumber?: string; soNumber?: string }, user: any) {
    let packageIds: string[] = [];
    if (query.packageNumber) {
      const pkg = await this.prisma.dispatchPackage.findFirst({ where: { packageNumber: query.packageNumber } });
      if (pkg) packageIds = [pkg.id];
    } else if (query.gateOutNumber) {
      const gateOut = await this.prisma.dispatchGateOut.findFirst({ where: { gateOutNumber: query.gateOutNumber, companyId: user.companyId }, include: { packages: true } });
      if (gateOut) packageIds = gateOut.packages.map((p: any) => p.id);
    } else if (query.soNumber) {
      const so = await this.prisma.salesOrder.findFirst({ where: { soNumber: query.soNumber, companyId: user.companyId } });
      if (so) {
        const packages = await this.prisma.dispatchPackage.findMany({ where: { packing: { verification: { pickList: { dispatchPlan: { soId: so.id } } } } } });
        packageIds = packages.map((p: any) => p.id);
      }
    }
    if (packageIds.length === 0) throw new NotFoundException('No matching Dispatch trace found for this reference');
    return Promise.all(packageIds.map((id) => this.tracePackage(id, user)));
  }
}
