import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import { VehicleManagementService } from '../vehicle-management/vehicle-management.service';
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
    let vendorMismatchWarning: string | undefined;
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
        poId:          dto.poId,
        poNumber:      resolvedPoNumber,
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
    return { ...entry, vendorMismatchWarning };
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
  async verify(id: string, dto: VerifyGateInwardDto, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (entry.status !== GateInwardStatus.PENDING) throw new BadRequestException('Only PENDING entries can be verified');
    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: { status: GateInwardStatus.VERIFIED, verifiedById: user.id, verifiedAt: new Date(), remarks: dto.remarks || entry.remarks, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'PENDING' }, newValues: { status: 'VERIFIED' }, changedBy: user.id });
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
    return updated;
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
      vehicleLog: { select: { id: true, logNumber: true, vehicle: { select: { vehicleNumber: true } } } },
      items:      { where: { isActive: true } },
    };
  }
}
