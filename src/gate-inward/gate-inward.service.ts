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
    // GATE-003/004/005: a referenced PO can fail to resolve in three
    // distinct ways - not found at all, found but CANCELLED, or found
    // but CLOSED. None of these are an error to reject the arrival
    // outright (material has physically arrived either way); each
    // becomes its own hold status so the entry is still created and
    // tracked, but never enters the normal verify/gate-in/GRN flow
    // until Purchase resolves it. Any OTHER invalid status (DRAFT,
    // APPROVED - not yet sent) stays a hard rejection, since that's
    // a data-entry error rather than a genuine PO-lifecycle exception.
    let initialStatus: GateInwardStatus = GateInwardStatus.PENDING;
    let holdBecausePoNotFound = false;
    let holdBecausePoInvalidStatus = false;
    let holdBecauseVendorMismatch = false;
    let resolvedPoForNotification: { poNumber: string; status: string } | null = null;
    let mismatchForNotification: { expected: string; actual: string } | null = null;

    // GATE-006: a vendor mismatch used to be a soft warning the
    // person could just click past - now it stops normal Gate-In the
    // same as the other PO exceptions, since it's just as real a
    // control point (wrong vendor material entering under a real PO
    // number is exactly the kind of thing this gate exists to catch).
    const checkVendorMismatch = (poVendorName: string) => {
      const supplierLower = dto.supplierName.trim().toLowerCase();
      const vendorLower = poVendorName.trim().toLowerCase();
      if (!supplierLower.includes(vendorLower) && !vendorLower.includes(supplierLower)) {
        holdBecauseVendorMismatch = true;
        initialStatus = GateInwardStatus.GATE_HOLD_VENDOR_MISMATCH;
        mismatchForNotification = { expected: poVendorName, actual: dto.supplierName };
      }
    };

    const resolvePoStatusHold = (status: string) => {
      if (status === 'CANCELLED') { initialStatus = GateInwardStatus.GATE_HOLD_PO_CANCELLED; return true; }
      if (status === 'CLOSED') { initialStatus = GateInwardStatus.GATE_HOLD_PO_CLOSED; return true; }
      return false;
    };

    if (dto.poId) {
      const po = await this.prisma.purchaseOrder.findFirst({
        where: { id: dto.poId, companyId: user.companyId },
        include: { vendor: { select: { name: true } } },
      });
      if (!po) throw new NotFoundException('Purchase Order not found');
      resolvedPoNumber = po.poNumber;
      resolvedPoId = po.id;
      if (!['SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
        holdBecausePoInvalidStatus = resolvePoStatusHold(po.status);
        if (holdBecausePoInvalidStatus) resolvedPoForNotification = { poNumber: po.poNumber, status: po.status };
        if (!holdBecausePoInvalidStatus) {
          throw new BadRequestException(`This PO is ${po.status} - only SENT or PARTIALLY_RECEIVED POs can receive a gate inward entry.`);
        }
      } else {
        checkVendorMismatch(po.vendor.name);
      }
    } else if (dto.poNumber?.trim()) {
      const matchedPo = await this.prisma.purchaseOrder.findFirst({
        where: { companyId: user.companyId, poNumber: dto.poNumber.trim() },
        include: { vendor: { select: { name: true } } },
      });
      if (matchedPo) {
        resolvedPoId = matchedPo.id;
        resolvedPoNumber = matchedPo.poNumber;
        if (!['SENT', 'PARTIALLY_RECEIVED'].includes(matchedPo.status)) {
          holdBecausePoInvalidStatus = resolvePoStatusHold(matchedPo.status);
          if (holdBecausePoInvalidStatus) resolvedPoForNotification = { poNumber: matchedPo.poNumber, status: matchedPo.status };
          if (!holdBecausePoInvalidStatus) {
            throw new BadRequestException(`This PO is ${matchedPo.status} - only SENT or PARTIALLY_RECEIVED POs can receive a gate inward entry.`);
          }
        } else {
          checkVendorMismatch(matchedPo.vendor.name);
        }
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
        mismatchType: holdBecauseVendorMismatch ? 'VENDOR' : undefined,
        mismatchExpectedValue: mismatchForNotification?.expected,
        mismatchActualValue: mismatchForNotification?.actual,
        mismatchFlaggedAt: holdBecauseVendorMismatch ? new Date() : undefined,
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
    if (holdBecausePoInvalidStatus && resolvedPoForNotification) {
      await this.notifyPurchaseOfPoStatusHold(entry, resolvedPoForNotification, user);
    }
    if (holdBecauseVendorMismatch && mismatchForNotification) {
      await this.notifyOfMismatchHold(entry, 'VENDOR', mismatchForNotification, user);
    }
    return entry;
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

  // GATE-004/005: notify Purchase the moment a CANCELLED or CLOSED PO
  // hold is created - same urgency as the PO Not Found hold, material
  // is physically sitting at the gate either way.
  private async notifyPurchaseOfPoStatusHold(entry: any, po: any, actorUser: any) {
    const purchaseUsers = await this.prisma.user.findMany({
      where: { companyId: actorUser.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'SUPER_ADMIN'] } },
      select: { id: true },
    });
    if (purchaseUsers.length === 0) return;
    await this.notifications.createBulk(
      purchaseUsers.map(u => ({
        userId: u.id,
        type: po.status === 'CANCELLED' ? 'GATE_HOLD_PO_CANCELLED' : 'GATE_HOLD_PO_CLOSED',
        title: `Gate Hold — PO ${po.status}`,
        message: `${entry.ginNumber} — ${entry.supplierName} — references PO ${po.poNumber} which is ${po.status}. Material is on hold at the gate pending your decision.`,
        referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
        priority: 'URGENT',
      })) as any,
      actorUser.companyId, actorUser.id,
    );
  }

  // GATE-006/007: notify Purchase, Corporate Admin, and Super Admin -
  // a wider approver set than the other gate holds, per this
  // requirement explicitly naming "purchase, admin, superadmin" as
  // the people who can decide on a mismatch.
  private async notifyOfMismatchHold(entry: any, mismatchType: 'VENDOR' | 'MATERIAL' | 'VEHICLE_NUMBER' | 'CHALLAN', values: { expected: string; actual: string }, actorUser: any) {
    const approverUsers = await this.prisma.user.findMany({
      where: { companyId: actorUser.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
    });
    if (approverUsers.length === 0) return;
    const labelMap = { VENDOR: 'Vendor', MATERIAL: 'Material', VEHICLE_NUMBER: 'Vehicle Number', CHALLAN: 'Challan' };
    const label = labelMap[mismatchType];
    const notifTypeMap = { VENDOR: 'GATE_HOLD_VENDOR_MISMATCH', MATERIAL: 'GATE_HOLD_MATERIAL_MISMATCH', VEHICLE_NUMBER: 'GATE_HOLD_VEHICLE_NUMBER_MISMATCH', CHALLAN: 'GATE_HOLD_CHALLAN_MISMATCH' };
    await this.notifications.createBulk(
      approverUsers.map(u => ({
        userId: u.id,
        type: notifTypeMap[mismatchType],
        title: `Gate Hold — ${label} Mismatch`,
        message: `${entry.ginNumber} — ${entry.supplierName} — ${label.toLowerCase()} mismatch. Expected: "${values.expected}", Actual: "${values.actual}". Material is on hold at the gate pending your decision.`,
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
      if (!entry.po) {
        missing.push('PO (linked PO no longer found)');
      } else if (!['SENT', 'PARTIALLY_RECEIVED'].includes(entry.po.status)) {
        // GATE-004/005: the PO's status changed between arrival and
        // verification (e.g. Purchase cancelled or closed it in the
        // meantime). Same treatment as catching this at creation time -
        // don't hard-reject, put the entry on hold instead so Purchase
        // can make the actual call.
        if (entry.po.status === 'CANCELLED' || entry.po.status === 'CLOSED') {
          const holdStatus = entry.po.status === 'CANCELLED' ? GateInwardStatus.GATE_HOLD_PO_CANCELLED : GateInwardStatus.GATE_HOLD_PO_CLOSED;
          const held = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: { status: holdStatus, updatedBy: user.id },
            include: this.includes(),
          });
          await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: holdStatus, reason: `PO ${entry.po.poNumber} is now ${entry.po.status}` }, changedBy: user.id });
          await this.notifyPurchaseOfPoStatusHold(held, entry.po, user);
          return held;
        }
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

  // GATE-004/005: resolution for a CANCELLED or CLOSED PO hold. Kept
  // as a separate assert + separate methods from GATE-003's PO Not
  // Found hold, per the requirement that these be implemented
  // separately - error messages and audit trail stay specific to
  // which PO-lifecycle problem actually occurred. Only Purchase can
  // call these (GATE_INWARD_RESOLVE_HOLD), and none of them ever
  // write to PurchaseOrder.status - Security/Gate cannot reopen a PO,
  // and neither can these resolution paths themselves; the PO's own
  // status is left exactly as Purchase already set it elsewhere.
  private async assertOnPoStatusHold(id: string) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    const validHoldStatuses: GateInwardStatus[] = [GateInwardStatus.GATE_HOLD_PO_CANCELLED, GateInwardStatus.GATE_HOLD_PO_CLOSED];
    if (!validHoldStatuses.includes(entry.status)) {
      throw new BadRequestException('This entry is not currently on a PO Cancelled/Closed hold');
    }
    return entry;
  }

  // Option 1: RETURN MATERIAL - material is sent back, never enters
  // Store. Reason is mandatory - this is a permanent record of why
  // the material was refused.
  async resolveReturnMaterial(id: string, reason: string, user: any) {
    const entry = await this.assertOnPoStatusHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.REJECTED, rejectionReason: reason,
        holdResolution: 'RETURN_MATERIAL', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: reason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'RETURN_MATERIAL', reason }, changedBy: user.id });
    return updated;
  }

  // Option 2: APPROVED EXCEPTION - Purchase authorizes receiving
  // despite the PO's CANCELLED/CLOSED status, per whatever business
  // justification they record. Returns to PENDING for the normal
  // GATE-002 flow, exactly as a non-PO exception would - the PO
  // itself is never touched or reopened.
  async resolveApprovedException(id: string, reason: string, user: any) {
    const entry = await this.assertOnPoStatusHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.PENDING,
        holdResolution: 'APPROVED_EXCEPTION', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: reason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'APPROVED_EXCEPTION', reason }, changedBy: user.id });
    return updated;
  }

  // Option 3: CORRECT PO REFERENCE - the CANCELLED/CLOSED PO was the
  // wrong one entirely (data-entry error); Purchase links the actual
  // correct, still-valid PO. Reason is mandatory here too, unlike
  // GATE-003's equivalent action, per this requirement's stricter
  // "every override requires reason" rule.
  async resolveCorrectPoReference(id: string, poId: string, reason: string, user: any) {
    const entry = await this.assertOnPoStatusHold(id);
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id: poId, companyId: user.companyId } });
    if (!po) throw new NotFoundException('Purchase Order not found');
    if (!['SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      throw new BadRequestException(`This PO is ${po.status} - only SENT or PARTIALLY_RECEIVED POs can receive a gate inward entry.`);
    }
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.PENDING, poId: po.id, poNumber: po.poNumber,
        holdResolution: 'CORRECT_PO_REFERENCE', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: reason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status, poId: entry.poId }, newValues: { status: 'PENDING', poId: po.id, poNumber: po.poNumber, holdResolution: 'CORRECT_PO_REFERENCE', reason }, changedBy: user.id });
    return updated;
  }

  // GATE-006/007: Gate/Security's own action to STOP a vehicle they
  // physically observe a mismatch on, even when nothing in the typed
  // data itself looks wrong (e.g. driver hands over material that
  // visibly doesn't match the challan). Deliberately uses the same
  // gate-level permission as verify() (GATE_INWARD_VERIFY), not the
  // Purchase-only resolve permission - flagging is Gate's job,
  // deciding what happens next is Purchase/Admin's.
  async flagMismatch(id: string, mismatchType: 'VENDOR' | 'MATERIAL' | 'VEHICLE_NUMBER' | 'CHALLAN', expectedValue: string, actualValue: string, remarks: string, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    const flaggableStatuses: GateInwardStatus[] = [GateInwardStatus.PENDING, GateInwardStatus.VERIFIED];
    if (!flaggableStatuses.includes(entry.status)) {
      throw new BadRequestException('Can only flag a mismatch before the vehicle is let in at the gate (entry must be PENDING or VERIFIED)');
    }
    // GATE-011: vehicle number mismatch reuses the exact same
    // flag/resolve mechanism as GATE-006/007 (vendor/material), just
    // with its own hold status and its own correction target -
    // deliberately not a parallel implementation, per the requirement
    // not to modify unrelated workflows through duplication.
    const holdStatusMap = {
      VENDOR: GateInwardStatus.GATE_HOLD_VENDOR_MISMATCH,
      MATERIAL: GateInwardStatus.GATE_HOLD_MATERIAL_MISMATCH,
      VEHICLE_NUMBER: GateInwardStatus.GATE_HOLD_VEHICLE_NUMBER_MISMATCH,
      CHALLAN: GateInwardStatus.GATE_HOLD_CHALLAN_MISMATCH,
    };
    const holdStatus = holdStatusMap[mismatchType];
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: holdStatus,
        mismatchType, mismatchExpectedValue: expectedValue, mismatchActualValue: actualValue,
        mismatchFlaggedById: user.id, mismatchFlaggedAt: new Date(),
        remarks: entry.remarks ? `${entry.remarks} | Mismatch flagged: ${remarks}` : `Mismatch flagged: ${remarks}`,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: holdStatus, mismatchType, expectedValue, actualValue, remarks }, changedBy: user.id });
    await this.notifyOfMismatchHold(updated, mismatchType, { expected: expectedValue, actual: actualValue }, user);
    return updated;
  }

  // GATE-006/007 resolution - shared by both mismatch types, same
  // three named outcomes and same wider approver set (Purchase,
  // Corporate Admin, Super Admin) as the mismatch notification.
  private async assertOnMismatchHold(id: string) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    const validHoldStatuses: GateInwardStatus[] = [GateInwardStatus.GATE_HOLD_VENDOR_MISMATCH, GateInwardStatus.GATE_HOLD_MATERIAL_MISMATCH, GateInwardStatus.GATE_HOLD_VEHICLE_NUMBER_MISMATCH, GateInwardStatus.GATE_HOLD_CHALLAN_MISMATCH];
    if (!validHoldStatuses.includes(entry.status)) {
      throw new BadRequestException('This entry is not currently on a Vendor/Material/Vehicle Number/Challan Mismatch hold');
    }
    return entry;
  }

  // Option 1: CORRECT REFERENCE - the declared vendor/material was
  // simply wrong (data-entry error); correct value is recorded and
  // the entry returns to normal flow. Does not require re-linking a
  // PO (unlike GATE-004/005's equivalent) since the PO itself was
  // never in question here - only what was declared against it.
  async resolveMismatchCorrectReference(id: string, correctedValue: string, reason: string, user: any) {
    const entry = await this.assertOnMismatchHold(id);
    const correctionData: any = {
      status: GateInwardStatus.PENDING,
      holdResolution: 'CORRECT_REFERENCE', holdResolvedById: user.id, holdResolvedAt: new Date(),
      holdResolutionRemarks: reason, updatedBy: user.id,
    };
    if (entry.mismatchType === 'VENDOR') correctionData.supplierName = correctedValue;
    else if (entry.mismatchType === 'MATERIAL') correctionData.materialDescription = correctedValue;
    else if (entry.mismatchType === 'VEHICLE_NUMBER') correctionData.vehicleNumber = correctedValue;
    else if (entry.mismatchType === 'CHALLAN') correctionData.invoiceNumber = correctedValue;
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: correctionData,
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'CORRECT_REFERENCE', correctedValue, reason }, changedBy: user.id });
    return updated;
  }

  // Option 2: APPROVED EXCEPTION - the mismatch is real but Purchase/
  // Admin authorizes receiving anyway, per whatever business reason
  // they record.
  async resolveMismatchApprovedException(id: string, reason: string, user: any) {
    const entry = await this.assertOnMismatchHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.PENDING,
        holdResolution: 'APPROVED_EXCEPTION', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: reason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'APPROVED_EXCEPTION', reason }, changedBy: user.id });
    return updated;
  }

  // Option 3: REJECTED AT GATE - the material is refused outright.
  // Same terminal REJECTED status as every other rejection path in
  // this service, so it inherits the same guarantee: a REJECTED
  // entry can never reach verify()/gateIn()/sendToStores(), and so
  // can never create Store inventory or a GRN.
  async resolveMismatchRejected(id: string, reason: string, user: any) {
    const entry = await this.assertOnMismatchHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.REJECTED, rejectionReason: reason,
        holdResolution: 'REJECTED_AT_GATE', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: reason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'REJECTED_AT_GATE', reason }, changedBy: user.id });
    return updated;
  }

  // GATE-008/009: Security's own visible-damage inspection - external
  // only, packages are never opened at this stage. Same gate-level
  // permission as flagMismatch(), callable before Gate-In only.
  // gateRecommendation is Gate's own call (REJECT or
  // ACCEPT_EXCEPTION) - it's their professional judgment on record,
  // but it is only a recommendation. The actual decision still
  // requires an approver via resolveDamage*, matching the
  // requirement that Gate can 'mark reject and send that for
  // approval' rather than finalize it unilaterally.
  async flagDamage(
    id: string,
    damageType: 'MATERIAL' | 'PACKAGING',
    description: string,
    affectedPackages: string | undefined,
    gateRecommendation: 'REJECT' | 'ACCEPT_EXCEPTION',
    user: any,
  ) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    const flaggableStatuses: GateInwardStatus[] = [GateInwardStatus.PENDING, GateInwardStatus.VERIFIED];
    if (!flaggableStatuses.includes(entry.status)) {
      throw new BadRequestException('Can only flag damage before the vehicle is let in at the gate (entry must be PENDING or VERIFIED)');
    }
    const holdStatus = damageType === 'MATERIAL' ? GateInwardStatus.GATE_HOLD_MATERIAL_DAMAGE : GateInwardStatus.GATE_HOLD_PACKAGING_DAMAGE;
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: holdStatus,
        damageType, damageDescription: description, affectedPackages, gateRecommendation,
        damageFlaggedById: user.id, damageFlaggedAt: new Date(),
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: holdStatus, damageType, description, affectedPackages, gateRecommendation }, changedBy: user.id });
    await this.notifyOfDamageHold(updated, damageType, user);
    return updated;
  }

  // Notifies the wider policy-defined set: Super Admin, Corporate
  // Admin, Purchase, Store Manager, and QC Manager - broader than any
  // other gate hold, since damaged material is simultaneously a
  // purchasing, quality, and storage concern.
  private async notifyOfDamageHold(entry: any, damageType: 'MATERIAL' | 'PACKAGING', actorUser: any) {
    const approverUsers = await this.prisma.user.findMany({
      where: { companyId: actorUser.companyId, isActive: true, role: { in: ['SUPER_ADMIN', 'CORPORATE_ADMIN', 'PURCHASE_MANAGER', 'STORE_MANAGER', 'QC_MANAGER'] } },
      select: { id: true },
    });
    if (approverUsers.length === 0) return;
    const label = damageType === 'MATERIAL' ? 'Material' : 'Packaging';
    await this.notifications.createBulk(
      approverUsers.map(u => ({
        userId: u.id,
        type: damageType === 'MATERIAL' ? 'GATE_HOLD_MATERIAL_DAMAGE' : 'GATE_HOLD_PACKAGING_DAMAGE',
        title: `Gate Hold — Visible ${label} Damage`,
        message: `${entry.ginNumber} — ${entry.supplierName} — visible ${label.toLowerCase()} damage flagged by Security. Gate recommends: ${entry.gateRecommendation === 'REJECT' ? 'Reject at Gate' : 'Accept under exception for detailed inspection'}. Awaiting your decision.`,
        referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
        priority: 'URGENT',
      })) as any,
      actorUser.companyId, actorUser.id,
    );
  }

  private async assertOnDamageHold(id: string) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    const validHoldStatuses: GateInwardStatus[] = [GateInwardStatus.GATE_HOLD_MATERIAL_DAMAGE, GateInwardStatus.GATE_HOLD_PACKAGING_DAMAGE];
    if (!validHoldStatuses.includes(entry.status)) {
      throw new BadRequestException('This entry is not currently on a Material/Packaging Damage hold');
    }
    return entry;
  }

  // Decision 1: REJECT AT GATE. No GRN, no inventory, no Store
  // receipt - same terminal REJECTED guarantee as every other
  // rejection path. Does NOT itself record the physical return - see
  // recordReturnGateOut for that, since the approval decision and the
  // vehicle actually leaving with the material can happen at
  // different times.
  async resolveDamageReject(id: string, reason: string, user: any) {
    const entry = await this.assertOnDamageHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.REJECTED, rejectionReason: reason,
        holdResolution: 'REJECT', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: reason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'REJECT', reason }, changedBy: user.id });
    return updated;
  }

  // Decision 2: ACCEPT UNDER EXCEPTION FOR DETAILED STORE/QC
  // INSPECTION. Returns to the normal flow (PENDING), but the
  // exception is recorded on the entry itself so whoever processes
  // the resulting GRN/IQC downstream can see it required special
  // handling - this does not create a separate parallel inspection
  // workflow, it flags the existing one.
  async resolveDamageAcceptException(id: string, reason: string, user: any) {
    const entry = await this.assertOnDamageHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.PENDING,
        holdResolution: 'ACCEPT_EXCEPTION_FOR_INSPECTION', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: reason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'ACCEPT_EXCEPTION_FOR_INSPECTION', reason }, changedBy: user.id });
    return updated;
  }

  // Records the physical return once a damage-hold rejection has
  // actually left the gate. Gate-level action (same permission as
  // gateIn/verify), only valid on an entry that was rejected via a
  // damage hold and hasn't already been recorded as returned.
  // Generalized beyond GATE-008/009: any rejected entry can need a
  // physical return record, not only damage-hold rejections - the
  // requirement across GATE-012 onward names RETURN as one of the
  // five general determinations (NORMAL/HOLD/EXCEPTION/REJECT/RETURN),
  // not something exclusive to visible damage.
  async recordReturnGateOut(id: string, remarks: string, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (entry.status !== GateInwardStatus.REJECTED) {
      throw new BadRequestException('Return Gate-Out can only be recorded for a rejected entry');
    }
    if (entry.returnGateOutAt) {
      throw new BadRequestException('Return Gate-Out has already been recorded for this entry');
    }
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: { returnGateOutById: user.id, returnGateOutAt: new Date(), returnRemarks: remarks, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { returnGateOutAt: null }, newValues: { returnGateOutAt: updated.returnGateOutAt, remarks }, changedBy: user.id });
    return updated;
  }

  // GATE-012: Challan / Invoice Document Missing. The vehicle
  // arrived with no physical document at all - genuinely different
  // from GATE-002's field-level check (which just requires the
  // invoiceNumber field to be filled in and blocks with a plain
  // error until it is). Here there is nothing to fill in: Gate is
  // explicitly acknowledging the document does not exist yet, which
  // is a real business decision point, not a data-entry gap.
  async flagDocumentMissing(id: string, documentType: 'CHALLAN' | 'INVOICE' | 'BOTH', reason: string, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    const flaggableStatuses: GateInwardStatus[] = [GateInwardStatus.PENDING, GateInwardStatus.VERIFIED];
    if (!flaggableStatuses.includes(entry.status)) {
      throw new BadRequestException('Can only flag a missing document before the vehicle is let in at the gate (entry must be PENDING or VERIFIED)');
    }
    const label = documentType === 'BOTH' ? 'Challan and Invoice' : documentType === 'CHALLAN' ? 'Challan' : 'Invoice';
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.GATE_HOLD_DOCUMENT_MISSING,
        documentMissingType: documentType,
        mismatchExpectedValue: `${label} document`, mismatchActualValue: 'Not provided at arrival',
        mismatchFlaggedById: user.id, mismatchFlaggedAt: new Date(),
        remarks: entry.remarks ? `${entry.remarks} | Document missing flagged: ${reason}` : `Document missing flagged: ${reason}`,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'GATE_HOLD_DOCUMENT_MISSING', documentType, reason }, changedBy: user.id });
    await this.notifyOfDocumentMissingHold(updated, documentType, user);
    return updated;
  }

  private async notifyOfDocumentMissingHold(entry: any, documentType: string, actorUser: any) {
    const approverUsers = await this.prisma.user.findMany({
      where: { companyId: actorUser.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'STORE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
    });
    if (approverUsers.length === 0) return;
    const label = documentType === 'BOTH' ? 'Challan and Invoice' : documentType === 'CHALLAN' ? 'Challan' : 'Invoice';
    await this.notifications.createBulk(
      approverUsers.map(u => ({
        userId: u.id,
        type: 'GATE_HOLD_DOCUMENT_MISSING',
        title: 'Gate Hold — Document Missing',
        message: `${entry.ginNumber} — ${entry.supplierName} — arrived without a ${label} document. Material is on hold at the gate pending your decision.`,
        referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
        priority: 'URGENT',
      })) as any,
      actorUser.companyId, actorUser.id,
    );
  }

  private async assertOnDocumentMissingHold(id: string) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (entry.status !== GateInwardStatus.GATE_HOLD_DOCUMENT_MISSING) {
      throw new BadRequestException('This entry is not currently on a Document Missing hold');
    }
    return entry;
  }

  // Decision 1: EXCEPTION - accept the material now on the vendor's
  // undertaking that the document will follow (a common, legitimate
  // real-world practice). Returns to PENDING for the normal flow.
  async resolveDocumentMissingException(id: string, reason: string, user: any) {
    const entry = await this.assertOnDocumentMissingHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.PENDING,
        holdResolution: 'ACCEPTED_WITH_UNDERTAKING', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: reason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'ACCEPTED_WITH_UNDERTAKING', reason }, changedBy: user.id });
    return updated;
  }

  // Decision 2: REJECT - terminal REJECTED, same never-reaches-Store/
  // GRN guarantee as every other rejection path. Return Gate-Out can
  // then be recorded via the now-general recordReturnGateOut().
  async resolveDocumentMissingReject(id: string, reason: string, user: any) {
    const entry = await this.assertOnDocumentMissingHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.REJECTED, rejectionReason: reason,
        holdResolution: 'REJECTED', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: reason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'REJECTED', reason }, changedBy: user.id });
    return updated;
  }

  // GATE-010: Package/Carton Count Mismatch. Gate's own physical
  // count-and-compare action, same permission and PENDING/VERIFIED
  // restriction as flagMismatch/flagDamage. Compares against the
  // declared packageCount as it already stands on the entry - this
  // action never writes to packageCount itself, so the vendor
  // challan figure is never silently corrected to match what was
  // physically counted; only the comparison result is recorded.
  async verifyPackageCount(id: string, actualPackageCount: number, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    const flaggableStatuses: GateInwardStatus[] = [GateInwardStatus.PENDING, GateInwardStatus.VERIFIED];
    if (!flaggableStatuses.includes(entry.status)) {
      throw new BadRequestException('Can only verify package count before the vehicle is let in at the gate (entry must be PENDING or VERIFIED)');
    }
    const declared = entry.packageCount ?? 0;
    const difference = actualPackageCount - declared;

    if (difference === 0) {
      // Match - continue Gate-In. No status change, just a record
      // that the physical count was actually performed.
      const updated = await this.prisma.gateInwardEntry.update({
        where: { id },
        data: { packageCountVerifiedById: user.id, packageCountVerifiedAt: new Date(), updatedBy: user.id },
        include: this.includes(),
      });
      await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: {}, newValues: { packageCountVerified: true, declared, actual: actualPackageCount }, changedBy: user.id });
      return updated;
    }

    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.GATE_HOLD_PACKAGE_COUNT_MISMATCH,
        packageCountExpected: declared, packageCountActual: actualPackageCount, packageCountDifference: difference,
        packageCountVerifiedById: user.id, packageCountVerifiedAt: new Date(),
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'GATE_HOLD_PACKAGE_COUNT_MISMATCH', expected: declared, actual: actualPackageCount, difference }, changedBy: user.id });
    await this.notifyOfPackageCountHold(updated, user);
    return updated;
  }

  private async notifyOfPackageCountHold(entry: any, actorUser: any) {
    const approverUsers = await this.prisma.user.findMany({
      where: { companyId: actorUser.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'STORE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
    });
    if (approverUsers.length === 0) return;
    await this.notifications.createBulk(
      approverUsers.map(u => ({
        userId: u.id,
        type: 'GATE_HOLD_PACKAGE_COUNT_MISMATCH',
        title: 'Gate Hold — Package Count Mismatch',
        message: `${entry.ginNumber} — ${entry.supplierName} — declared ${entry.packageCountExpected} packages, ${entry.packageCountActual} counted at the gate (difference: ${entry.packageCountDifference > 0 ? '+' : ''}${entry.packageCountDifference}). Awaiting your decision.`,
        referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
        priority: 'URGENT',
      })) as any,
      actorUser.companyId, actorUser.id,
    );
  }

  private async assertOnPackageCountHold(id: string) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (entry.status !== GateInwardStatus.GATE_HOLD_PACKAGE_COUNT_MISMATCH) {
      throw new BadRequestException('This entry is not currently on a Package Count Mismatch hold');
    }
    return entry;
  }

  // Option 1: RECOUNT. Gate-level action (same permission as
  // verifyPackageCount) - a recount is Gate re-doing their own
  // physical count, not an approver decision. If the new count now
  // matches the declared figure, the hold resolves itself back to
  // PENDING; if it still doesn't match, the recorded actual/
  // difference is updated and the hold stays open for escalation.
  async resolvePackageCountRecount(id: string, newActualCount: number, remarks: string, user: any) {
    const entry = await this.assertOnPackageCountHold(id);
    const declared = entry.packageCountExpected ?? 0;
    const difference = newActualCount - declared;

    if (difference === 0) {
      const updated = await this.prisma.gateInwardEntry.update({
        where: { id },
        data: {
          status: GateInwardStatus.PENDING,
          packageCountActual: newActualCount, packageCountDifference: 0,
          holdResolution: 'RECOUNT_MATCHED', holdResolvedById: user.id, holdResolvedAt: new Date(),
          holdResolutionRemarks: remarks, updatedBy: user.id,
        },
        include: this.includes(),
      });
      await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'RECOUNT_MATCHED', newActualCount, remarks }, changedBy: user.id });
      return updated;
    }

    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: { packageCountActual: newActualCount, packageCountDifference: difference, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { packageCountActual: entry.packageCountActual }, newValues: { packageCountActual: newActualCount, packageCountDifference: difference, remarks }, changedBy: user.id });
    return updated;
  }

  // Option 2: PURCHASE/STORE VERIFICATION. An escalation, not a
  // terminal decision - marks that Purchase/Store have been
  // specifically asked to verify (e.g. check delivery history,
  // contact the vendor) and re-notifies them, but the hold stays
  // open until one of the two actual decisions below is made.
  async resolvePackageCountEscalate(id: string, remarks: string, user: any) {
    const entry = await this.assertOnPackageCountHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: { packageCountEscalated: true, packageCountEscalatedAt: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { packageCountEscalated: false }, newValues: { packageCountEscalated: true, remarks }, changedBy: user.id });
    await this.notifyOfPackageCountHold(updated, user);
    return updated;
  }

  // Option 3: APPROVED INWARD. Accepts the material despite the
  // count mismatch, per whatever business reason is recorded (e.g.
  // partial shipment expected, discrepancy accepted as vendor error
  // to be resolved via debit note later). Returns to PENDING for the
  // normal flow - packageCount on the entry is still never touched.
  async resolvePackageCountApprovedInward(id: string, reason: string, user: any) {
    const entry = await this.assertOnPackageCountHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.PENDING,
        holdResolution: 'APPROVED_INWARD', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: reason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'APPROVED_INWARD', reason }, changedBy: user.id });
    return updated;
  }

  // Option 4: REJECTION. Terminal REJECTED status - same guarantee as
  // every other rejection path in this service.
  async resolvePackageCountRejected(id: string, reason: string, user: any) {
    const entry = await this.assertOnPackageCountHold(id);
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: {
        status: GateInwardStatus.REJECTED, rejectionReason: reason,
        holdResolution: 'REJECTED', holdResolvedById: user.id, holdResolvedAt: new Date(),
        holdResolutionRemarks: reason, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'REJECTED', reason }, changedBy: user.id });
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
