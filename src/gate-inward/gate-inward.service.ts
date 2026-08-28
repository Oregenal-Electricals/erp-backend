import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import { VehicleManagementService } from '../vehicle-management/vehicle-management.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateGateInwardDto,
  UpdateGateInwardDto,
  VerifyGateInwardDto,
  RejectGateInwardDto,
  GateInDto,
} from './dto/gate-inward.dto';
import { GateInwardStatus } from '@prisma/client';
@Injectable()
export class GateInwardService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private settings: SettingsService,
    private vehicleManagement: VehicleManagementService,
    private notifications: NotificationsService,
  ) {}
  async create(dto: CreateGateInwardDto, user: any) {
    const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
    if (!plant) throw new NotFoundException('Plant not found');

    const hasFlatMaterial = !!dto.materialDescription && dto.quantity != null;
    const hasItems = Array.isArray(dto.items) && dto.items.length > 0;
    if (!hasFlatMaterial && !hasItems) {
      throw new BadRequestException('Provide either materialDescription + quantity, or a list of items');
    }

    if (dto.poId) {
      // Guard against accidental double-submission (double-click race,
      // browser back-button resubmit, network retry) creating a
      // near-identical duplicate GIN for the same PO moments apart.
      const recentDuplicate = await this.prisma.gateInwardEntry.findFirst({
        where: {
          companyId: user.companyId,
          poId: dto.poId,
          isActive: true,
          createdAt: { gte: new Date(Date.now() - 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (recentDuplicate) {
        throw new BadRequestException(
          `A Gate Inward entry (${recentDuplicate.ginNumber}) was already created for this PO less than a minute ago. ` +
          `If this is a genuinely separate delivery, please wait a moment and try again.`
        );
      }
    }

    // A vehicle physically can't be at the gate twice at once - block
    // creating a second active entry for the same vehicle number while
    // an earlier one for it hasn't been sent to stores/rejected yet.
    if (dto.vehicleNumber) {
      const activeForVehicle = await this.prisma.gateInwardEntry.findFirst({
        where: {
          companyId: user.companyId,
          vehicleNumber: dto.vehicleNumber,
          isActive: true,
          status: { in: ['PENDING', 'VERIFIED', 'GATE_IN'] },
        },
      });
      if (activeForVehicle) {
        throw new BadRequestException(
          `Vehicle ${dto.vehicleNumber} already has an active Gate Inward entry (${activeForVehicle.ginNumber}, status: ${activeForVehicle.status}). Complete or reject that one first.`
        );
      }
    }
    // A routine vendor arrival shouldn't require security to first
    // go create a separate Vehicle Log - if a vehicleNumber was
    // given and no explicit vehicleLogId, find-or-create the Vehicle
    // master and an active VehicleLog for it automatically.
    let resolvedVehicleLogId = dto.vehicleLogId;
    if (!resolvedVehicleLogId && dto.vehicleNumber) {
      const autoLog = await this.vehicleManagement.findOrCreateActiveLog({
        vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName,
        plantId: dto.plantId,
        purpose: 'INWARD',
        companyId: user.companyId,
        userId: user.id,
        materialDescription: dto.materialDescription,
        supplierName: dto.supplierName,
        poNumber: dto.poNumber,
      });
      resolvedVehicleLogId = autoLog.id;
    }

    let ginNumber: string;
    try {
      ginNumber = await this.settings.getNextNumber(user.companyId, 'GIN');
    } catch {
      const count = await this.prisma.gateInwardEntry.count({ where: { companyId: user.companyId } });
      const now = new Date();
      const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      ginNumber = `GIN-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
    }
    let resolvedPoNumber = dto.poNumber;
    let resolvedPoId = dto.poId;
    let vendorMismatchWarning: string | undefined;
    // GATE-003: a PO number was referenced (typed or otherwise) but
    // doesn't resolve to a real PO - this is not an error to reject
    // the arrival outright (material has physically arrived either
    // way), it's a hold: the entry is still created so there's a
    // record, but it never enters the normal verify/gate-in/GRN flow
    // until Purchase resolves it. Gate/Security can never fabricate
    // a PO to work around this - only Purchase can identify the
    // correct one, authorize a non-PO exception, or reject.
    let initialStatus: GateInwardStatus = GateInwardStatus.PENDING;
    let holdBecausePoNotFound = false;

    if (dto.poId) {
      const po = await this.prisma.purchaseOrder.findFirst({
        where: { id: dto.poId, companyId: user.companyId },
        include: { vendor: { select: { name: true } } },
      });
      if (!po) throw new NotFoundException('Purchase Order not found');
      if (!['SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
        throw new BadRequestException(`This PO is ${po.status} - only SENT or PARTIALLY_RECEIVED POs can receive a gate inward entry.`);
      }
      resolvedPoNumber = po.poNumber;
      const supplierLower = dto.supplierName.trim().toLowerCase();
      const vendorLower = po.vendor.name.trim().toLowerCase();
      if (!supplierLower.includes(vendorLower) && !vendorLower.includes(supplierLower)) {
        vendorMismatchWarning = `Supplier name "${dto.supplierName}" does not match this PO's vendor "${po.vendor.name}" - please verify before accepting.`;
      }
    } else if (dto.poNumber?.trim()) {
      const matchedPo = await this.prisma.purchaseOrder.findFirst({
        where: { companyId: user.companyId, poNumber: dto.poNumber.trim() },
      });
      if (matchedPo) {
        resolvedPoId = matchedPo.id;
        resolvedPoNumber = matchedPo.poNumber;
      } else {
        holdBecausePoNotFound = true;
        initialStatus = GateInwardStatus.GATE_HOLD_PO_NOT_FOUND;
      }
    }

    const materialDescription = dto.materialDescription
      ?? (hasItems ? dto.items!.map((i) => i.itemName).join(', ') : undefined);
    const quantity = dto.quantity
      ?? (hasItems ? dto.items!.reduce((s, i) => s + i.quantity, 0) : undefined);
    // Same synthesis for package count - previously always null when
    // the items[] path was used, so the detail page showed "—" for
    // Package Count even when every item row had a real count entered.
    const itemsPackageTotal = hasItems
      ? dto.items!.reduce((s, i) => s + (i.packageCount || 0), 0)
      : 0;
    const packageCount = dto.packageCount
      ?? (itemsPackageTotal > 0 ? itemsPackageTotal : undefined);

    const entry = await this.prisma.gateInwardEntry.create({
      data: {
        ginNumber,
        companyId:   user.companyId,
        plantId:     dto.plantId,
        vehicleLogId: resolvedVehicleLogId,
        vehicleNumber: dto.vehicleNumber,
        driverName:    dto.driverName,
        supplierName:  dto.supplierName,
        supplierMobile: dto.supplierMobile,
        supplierGstin:  dto.supplierGstin,
        poId:          resolvedPoId,
        poNumber:      resolvedPoNumber,
        status:        initialStatus,
        invoiceNumber: dto.invoiceNumber,
        invoiceDate:   dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
        invoiceAmount: dto.invoiceAmount,
        materialDescription,
        quantity,
        unit:          dto.unit ?? 'NOS',
        grossWeight:   dto.grossWeight,
        netWeight:     dto.netWeight,
        packageCount,
        remarks:       dto.remarks,
        receivedById:  user.id,
        createdBy:     user.id,
        updatedBy:     user.id,
        items: hasItems ? {
          create: dto.items!.map((i) => ({
            companyId: user.companyId,
            poItemId: i.poItemId,
            itemCode: i.itemCode,
            itemName: i.itemName,
            uom: i.uom ?? 'NOS',
            quantity: i.quantity,
            packageCount: i.packageCount,
            remarks: i.remarks,
            createdBy: user.id,
            updatedBy: user.id,
          })),
        } : undefined,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: entry.id, action: 'CREATE', newValues: { ginNumber, supplierName: dto.supplierName }, changedBy: user.id });
    if (holdBecausePoNotFound) {
      await this.notifyPurchaseOfHold(entry, user);
    }
    return { ...entry, vendorMismatchWarning };
  }

  // GATE-003: notify Purchase the moment a hold is created - they
  // need to act on this quickly since material is physically sitting
  // at the gate.
  private async notifyPurchaseOfHold(entry: any, actorUser: any) {
    const purchaseUsers = await this.prisma.user.findMany({
      where: { companyId: actorUser.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'SUPER_ADMIN'] } },
      select: { id: true },
    });
    if (purchaseUsers.length === 0) return;
    await this.notifications.createBulk(
      purchaseUsers.map(u => ({
        userId: u.id,
        type: 'GATE_HOLD_PO_NOT_FOUND',
        title: 'Gate Hold — PO Not Found',
        message: `${entry.ginNumber} — ${entry.supplierName} — references PO "${entry.poNumber}" which could not be found. Material is on hold at the gate pending your decision.`,
        referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
        priority: 'URGENT',
      })) as any,
      actorUser.companyId, actorUser.id,
    );
  }
  async findAll(user: any, filters: { status?: GateInwardStatus; plantId?: string; date?: string; search?: string }) {
    const where: any = { companyId: user.companyId };
    if (filters.status)  where.status  = filters.status;
    if (filters.plantId) where.plantId = filters.plantId;
    if (filters.search) {
      where.OR = [
        { ginNumber:     { contains: filters.search, mode: 'insensitive' } },
        { supplierName:  { contains: filters.search, mode: 'insensitive' } },
        { poNumber:      { contains: filters.search, mode: 'insensitive' } },
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { materialDescription: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.date) {
      const d = new Date(filters.date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.createdAt = { gte: d, lt: next };
    }
    return this.prisma.gateInwardEntry.findMany({ where, include: this.includes(), orderBy: { createdAt: 'desc' } });
  }
  async findOne(id: string) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    return entry;
  }
  async update(id: string, dto: UpdateGateInwardDto, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (!['PENDING'].includes(entry.status)) throw new BadRequestException('Only PENDING entries can be updated');
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id }, data: { ...dto, updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: dto, changedBy: user.id });
    return updated;
  }
  // GATE-002: Valid PO and Challan Verification. Document checks are
  // enforced here rather than trusted from creation time, since the
  // PO's status especially can change between when the entry was
  // created and when security is actually verifying it at the gate
  // (e.g. cancelled or fully received in the meantime). Never writes
  // to PurchaseOrder itself - security can only ever affect this
  // GateInwardEntry, so PO quantities/prices/terms are structurally
  // untouchable from this action.
  async verify(id: string, dto: VerifyGateInwardDto, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: { po: true } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (entry.status === GateInwardStatus.GATE_HOLD_PO_NOT_FOUND) {
      throw new BadRequestException('This entry is on a Gate Hold — PO Not Found. It cannot be verified until Purchase resolves the hold.');
    }
    if (entry.status !== GateInwardStatus.PENDING) throw new BadRequestException('Only PENDING entries can be verified');

    const missing: string[] = [];
    if (!entry.supplierName?.trim()) missing.push('Vendor');
    if (!entry.invoiceNumber?.trim()) missing.push('Challan/Invoice Number');
    if (!entry.vehicleLogId && !entry.vehicleNumber) missing.push('Vehicle');
    const hasMaterialRef = !!entry.materialDescription?.trim() || (await this.prisma.gateInwardItem.count({ where: { gateInwardEntryId: id, isActive: true } })) > 0;
    if (!hasMaterialRef) missing.push('Material reference');

    if (entry.poId) {
      if (!entry.po) missing.push('PO (linked PO no longer found)');
      else if (!['SENT', 'PARTIALLY_RECEIVED'].includes(entry.po.status)) {
        throw new BadRequestException(`Cannot verify - PO ${entry.po.poNumber} is now ${entry.po.status}, no longer valid for receiving. Reject this entry or contact Purchase.`);
      }
    }

    if (missing.length > 0) {
      throw new BadRequestException(`Cannot mark Document Verified - missing or invalid: ${missing.join(', ')}`);
    }

    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: { status: GateInwardStatus.VERIFIED, verifiedById: user.id, verifiedAt: new Date(), remarks: dto.remarks || entry.remarks, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'PENDING' }, newValues: { status: 'VERIFIED', documentChecks: { vendor: true, challan: true, vehicle: true, materialReference: true, poStatus: entry.poId ? entry.po?.status : 'N/A' } }, changedBy: user.id });
    return updated;
  }
  async gateIn(id: string, dto: GateInDto, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (entry.status !== GateInwardStatus.VERIFIED) throw new BadRequestException('Only VERIFIED entries can be let in at the gate');
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: { status: GateInwardStatus.GATE_IN, gateInById: user.id, gateInAt: new Date(), remarks: dto.remarks || entry.remarks, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'VERIFIED' }, newValues: { status: 'GATE_IN' }, changedBy: user.id });
    await this.notifyStoreReceivingReference(updated, user);
    return updated;
  }

  // "Create Store receiving reference" per GATE-002 - not a GRN
  // (Store still independently receives the material and creates
  // that themselves), just an alert pointing Store at the GIN number
  // now that the vehicle has physically been let in.
  private async notifyStoreReceivingReference(entry: any, actorUser: any) {
    const storeUsers = await this.prisma.user.findMany({
      where: { companyId: actorUser.companyId, isActive: true, role: { in: ['STORE_MANAGER', 'SUPER_ADMIN'] } },
      select: { id: true },
    });
    if (storeUsers.length === 0) return;
    await this.notifications.createBulk(
      storeUsers.map(u => ({
        userId: u.id,
        type: 'GATE_INWARD_READY_FOR_STORE',
        title: 'Material ready for receiving',
        message: `${entry.ginNumber} — ${entry.supplierName} — has cleared the gate and is ready for Store to receive.`,
        referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
        priority: 'MEDIUM',
      })) as any,
      actorUser.companyId, actorUser.id,
    );
  }
  async sendToStores(id: string, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (entry.status !== GateInwardStatus.GATE_IN) throw new BadRequestException('Only GATE_IN entries can be sent to stores');
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: { status: GateInwardStatus.SENT_TO_STORES, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'GATE_IN' }, newValues: { status: 'SENT_TO_STORES' }, changedBy: user.id });
    return updated;
  }
  async complete(id: string, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (entry.status !== GateInwardStatus.SENT_TO_STORES) throw new BadRequestException('Only SENT_TO_STORES entries can be completed');
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: { status: GateInwardStatus.COMPLETED, completedAt: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'SENT_TO_STORES' }, newValues: { status: 'COMPLETED' }, changedBy: user.id });
    return updated;
  }
  async reject(id: string, dto: RejectGateInwardDto, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (['COMPLETED', 'REJECTED'].includes(entry.status)) throw new BadRequestException(`Cannot reject a ${entry.status} entry`);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: { status: GateInwardStatus.REJECTED, rejectionReason: dto.rejectionReason, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', rejectionReason: dto.rejectionReason }, changedBy: user.id });
    return updated;
  }

  // GATE-003: the three ways Purchase can resolve a PO Not Found
  // hold. Never callable by Gate/Security - gated behind
  // GATE_INWARD_RESOLVE_HOLD, held only by Purchase Manager/Super
  // Admin, so Gate genuinely cannot manufacture its own way out of a
  // hold.
  private async assertOnHold(id: string) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (entry.status !== GateInwardStatus.GATE_HOLD_PO_NOT_FOUND) {
      throw new BadRequestException('This entry is not currently on a PO Not Found hold');
    }
    return entry;
  }

  // Option 1: Purchase identifies the correct PO. Returns the entry
  // to the normal flow (PENDING) so GATE-002's verify step can run
  // against it like any other PO-linked arrival.
  async resolveHoldWithPo(id: string, poId: string, remarks: string | undefined, user: any) {
    const entry = await this.assertOnHold(id);
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id: poId, companyId: user.companyId } });
    if (!po) throw new NotFoundException('Purchase Order not found');
    if (!['SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      throw new BadRequestException(`This PO is ${po.status} - only SENT or PARTIALLY_RECEIVED POs can receive a gate inward entry.`);
    }
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.PENDING, poId: po.id, poNumber: po.poNumber,
        holdResolution: 'PO_IDENTIFIED', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: remarks, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status, poId: entry.poId }, newValues: { status: 'PENDING', poId: po.id, poNumber: po.poNumber, holdResolution: 'PO_IDENTIFIED' }, changedBy: user.id });
    return updated;
  }

  // Option 2: Purchase authorizes this as a legitimate non-PO
  // receipt per business policy - returns to PENDING with no PO
  // link, same as any other non-PO delivery GATE-001 already
  // supports, just with an explicit authorization on record.
  async resolveHoldAsNonPo(id: string, remarks: string, user: any) {
    const entry = await this.assertOnHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.PENDING,
        holdResolution: 'NON_PO_AUTHORIZED', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: remarks, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'NON_PO_AUTHORIZED', remarks }, changedBy: user.id });
    return updated;
  }

  // Option 3: Purchase rejects the material outright.
  async resolveHoldAsRejected(id: string, rejectionReason: string, user: any) {
    const entry = await this.assertOnHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.REJECTED, rejectionReason,
        holdResolution: 'REJECTED', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: rejectionReason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'REJECTED', rejectionReason }, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const base = { companyId: user.companyId };
    const [total, pending, verified, sentToStores, completed, rejected, todayIn] = await Promise.all([
      this.prisma.gateInwardEntry.count({ where: base }),
      this.prisma.gateInwardEntry.count({ where: { ...base, status: 'PENDING' } }),
      this.prisma.gateInwardEntry.count({ where: { ...base, status: 'VERIFIED' } }),
      this.prisma.gateInwardEntry.count({ where: { ...base, status: 'SENT_TO_STORES' } }),
      this.prisma.gateInwardEntry.count({ where: { ...base, status: 'COMPLETED' } }),
      this.prisma.gateInwardEntry.count({ where: { ...base, status: 'REJECTED' } }),
      this.prisma.gateInwardEntry.count({ where: { ...base, createdAt: { gte: today, lt: tomorrow } } }),
    ]);
    return { total, pending, verified, sentToStores, completed, rejected, todayIn };
  }
  private includes() {
    return {
      plant:      { select: { id: true, name: true, code: true } },
      receivedBy: { select: { id: true, firstName: true, lastName: true } },
      verifiedBy: { select: { id: true, firstName: true, lastName: true } },
      gateInBy:   { select: { id: true, firstName: true, lastName: true } },
      holdResolvedBy: { select: { id: true, firstName: true, lastName: true } },
      vehicleLog: { select: { id: true, logNumber: true, vehicle: { select: { vehicleNumber: true } } } },
      items:      { where: { isActive: true } },
    };
  }
}
