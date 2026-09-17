import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class DispatchPackingService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generatePackingNumber(companyId: string): Promise<string> {
    const count = await this.prisma.dispatchPacking.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `DPK-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generatePackageNumber(companyId: string): Promise<string> {
    const count = await this.prisma.dispatchPackage.count({ where: { packing: { companyId } } });
    return `PKG-${String(count + 1).padStart(6, '0')}`;
  }

  private includes() {
    return {
      verification: { select: { verificationNumber: true } },
      salesOrder: { select: { soNumber: true, customerName: true } },
      packages: { include: { items: true } },
    };
  }

  // DSP-008 section 6: originates only from actual DSP-007 VERIFIED
  // quantity - never from raw picked/reserved demand.
  async createPacking(verificationId: string, user: any) {
    const verification = await this.prisma.dispatchVerification.findFirst({ where: { id: verificationId, companyId: user.companyId } });
    if (!verification) throw new NotFoundException('Verification not found');
    if (verification.status === 'CANCELLED') throw new BadRequestException('This Verification is cancelled');
    if (verification.status === 'PENDING' || verification.status === 'EXCEPTION') {
      throw new BadRequestException('This Verification has no verified quantity yet to pack');
    }

    const packingNumber = await this.generatePackingNumber(user.companyId);
    const packing = await this.prisma.dispatchPacking.create({
      data: {
        packingNumber, verificationId, soId: verification.soId, customerName: verification.customerName,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'dispatch_packings', recordId: packing.id, action: 'CREATE', newValues: packing, changedBy: user.id });
    return packing;
  }

  // DSP-008 sections 8-9: unique business identity per physical
  // package, independent of the row id.
  async createPackage(packingId: string, user: any, packageType?: string, netWeight?: number, grossWeight?: number) {
    const packing = await this.prisma.dispatchPacking.findFirst({ where: { id: packingId, companyId: user.companyId } });
    if (!packing) throw new NotFoundException('Packing not found');
    if (packing.status === 'CANCELLED') throw new BadRequestException('This Packing is cancelled');

    const packageNumber = await this.generatePackageNumber(user.companyId);
    const pkg = await this.prisma.dispatchPackage.create({
      data: { packingId, packageNumber, packageType: packageType || 'CARTON', netWeight, grossWeight, createdBy: user.id, updatedBy: user.id },
      include: { items: true },
    });
    await this.audit.log({ tableName: 'dispatch_packages', recordId: pkg.id, action: 'CREATE', newValues: pkg, changedBy: user.id });
    return pkg;
  }

  // DSP-008 sections 5, 25, 88, 94: packed is a nested subset of
  // verified - the ceiling is that verification event's own
  // verifiedQty minus verify-reversedQty minus already-packed-net-
  // of-reversed on THIS verification item, never a second
  // independent claim.
  private async remainingToPack(verificationItemId: string, verifiedQty: number, verifyReversedQty: number) {
    const agg = await this.prisma.dispatchPackageItem.aggregate({
      where: { verificationItemId, isActive: true },
      _sum: { packedQty: true, reversedQty: true },
    });
    const netPacked = (agg._sum.packedQty || 0) - (agg._sum.reversedQty || 0);
    return Math.max(verifiedQty - verifyReversedQty - netPacked, 0);
  }

  // DSP-008 sections 46-48: revalidates CURRENT quality/status fresh
  // at packing time - a DSP-007 verification does not override a
  // Hold/Reject that happened afterward. Mirrors DSP-007's own
  // revalidateQuality() exactly, against the same authoritative
  // fields, never a second parallel QC concept.
  private async revalidateQuality(verificationItem: any): Promise<{ ok: boolean; reason?: string }> {
    const pickListItem = await this.prisma.pickListItem.findUnique({ where: { id: verificationItem.pickListItemId } });
    if (!pickListItem) return { ok: false, reason: 'BLOCKED_STOCK' };
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
    return { ok: true };
  }

  // DSP-008 sections 15-19: SFG packing never touches the Production
  // routing "Packaging" stage or WorkOrder - this method writes only
  // to DispatchPackageItem, nothing else. That separation is
  // structural (no workOrder.update call exists anywhere below),
  // not merely a naming choice.
  async addPackageItem(packageId: string, verificationItemId: string, packedQty: number, user: any) {
    const pkg = await this.prisma.dispatchPackage.findFirst({ where: { id: packageId, packing: { companyId: user.companyId } } });
    if (!pkg) throw new NotFoundException('Package not found');
    if (pkg.status === 'REVERSED') throw new BadRequestException('This package has been reversed');

    const verificationItem = await this.prisma.dispatchVerificationItem.findFirst({ where: { id: verificationItemId, isActive: true } });
    if (!verificationItem) throw new NotFoundException('Verification event not found');
    if (verificationItem.status !== 'VERIFIED') throw new BadRequestException(`This verification event is ${verificationItem.status}, not eligible for packing`);

    const quality = await this.revalidateQuality(verificationItem);

    const remaining = await this.remainingToPack(verificationItemId, verificationItem.verifiedQty, verificationItem.reversedQty);
    if (packedQty > remaining) {
      throw new BadRequestException(`Pack qty ${packedQty} exceeds what remains to pack on this verification (${remaining}).`);
    }

    const item = await this.prisma.dispatchPackageItem.create({
      data: {
        packageId, verificationItemId, itemCode: verificationItem.itemCode, itemName: verificationItem.itemName,
        saleType: verificationItem.saleType,
        packedQty: quality.ok ? packedQty : 0,
        status: quality.ok ? 'PACKED' : 'REVERSED',
        reason: quality.ok ? null : quality.reason,
        createdBy: user.id, updatedBy: user.id,
      },
    });

    await this.refreshPackingStatus(pkg.packingId, user);

    await this.audit.log({
      tableName: 'dispatch_package_items', recordId: item.id, action: 'CREATE',
      newValues: { packageId, verificationItemId, requestedQty: packedQty, result: quality },
      changedBy: user.id,
    });

    if (!quality.ok) {
      throw new BadRequestException(`Packing blocked: ${quality.reason} - current quality status no longer eligible for packing.`);
    }
    return item;
  }

  private async refreshPackingStatus(packingId: string, user: any) {
    const packing = await this.prisma.dispatchPacking.findUnique({ where: { id: packingId }, include: { verification: { include: { items: true } }, packages: { include: { items: true } } } });
    if (!packing) return;
    const totalVerified = packing.verification.items.filter((i: any) => i.isActive).reduce((s: number, i: any) => s + (i.verifiedQty - i.reversedQty), 0);
    const allPackageItems = packing.packages.flatMap((p: any) => p.items).filter((i: any) => i.isActive);
    const totalPacked = allPackageItems.reduce((s: number, i: any) => s + (i.packedQty - i.reversedQty), 0);
    const status = totalPacked <= 0.0001 ? 'DRAFT' : totalPacked >= totalVerified - 0.0001 ? 'PACKED' : 'PARTIALLY_PACKED';
    await this.prisma.dispatchPacking.update({ where: { id: packingId }, data: { status, updatedBy: user.id } });
  }

  // DSP-008 sections 58-60: reversal returns quantity to Verified-
  // but-not-Packed state only - never touches Verification, Pick,
  // Reservation, or the Sales Order.
  async reversePackageItem(packageItemId: string, reverseQty: number, reason: string | undefined, user: any) {
    const item = await this.prisma.dispatchPackageItem.findFirst({
      where: { id: packageItemId, isActive: true, package: { packing: { companyId: user.companyId } } },
    });
    if (!item) throw new NotFoundException('Package item not found');
    const stillPacked = item.packedQty - item.reversedQty;
    if (reverseQty > stillPacked) throw new BadRequestException(`Cannot reverse ${reverseQty} - only ${stillPacked} is currently packed.`);

    const newReversedQty = item.reversedQty + reverseQty;
    const updated = await this.prisma.dispatchPackageItem.update({
      where: { id: item.id },
      data: { reversedQty: newReversedQty, status: newReversedQty >= item.packedQty - 0.0001 ? 'REVERSED' : 'PACKED', reason, updatedBy: user.id },
    });
    const pkg = await this.prisma.dispatchPackage.findUnique({ where: { id: item.packageId } });
    if (pkg) await this.refreshPackingStatus(pkg.packingId, user);
    await this.audit.log({ tableName: 'dispatch_package_items', recordId: item.id, action: 'UPDATE', newValues: { reversedQty: newReversedQty, reason }, changedBy: user.id });
    return updated;
  }

  async findOne(id: string, user: any) {
    const packing = await this.prisma.dispatchPacking.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!packing) throw new NotFoundException('Packing not found');
    return packing;
  }
}
