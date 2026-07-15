import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import {
  CreateGateInwardDto,
  UpdateGateInwardDto,
  VerifyGateInwardDto,
  RejectGateInwardDto,
} from './dto/gate-inward.dto';
import { GateInwardStatus } from '@prisma/client';

@Injectable()
export class GateInwardService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private settings: SettingsService,
  ) {}

  async create(dto: CreateGateInwardDto, user: any) {
    const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
    if (!plant) throw new NotFoundException('Plant not found');

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

    const entry = await this.prisma.gateInwardEntry.create({
      data: {
        ginNumber,
        companyId:   user.companyId,
        plantId:     dto.plantId,
        vehicleLogId: dto.vehicleLogId,
        supplierName:  dto.supplierName,
        supplierMobile: dto.supplierMobile,
        supplierGstin:  dto.supplierGstin,
        poId:          dto.poId,
        poNumber:      resolvedPoNumber,
        invoiceNumber: dto.invoiceNumber,
        invoiceDate:   dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
        invoiceAmount: dto.invoiceAmount,
        materialDescription: dto.materialDescription,
        quantity:      dto.quantity,
        unit:          dto.unit ?? 'NOS',
        grossWeight:   dto.grossWeight,
        netWeight:     dto.netWeight,
        packageCount:  dto.packageCount,
        remarks:       dto.remarks,
        receivedById:  user.id,
        createdBy:     user.id,
        updatedBy:     user.id,
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

  async sendToStores(id: string, user: any) {
    const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate inward entry not found');
    if (entry.status !== GateInwardStatus.VERIFIED) throw new BadRequestException('Only VERIFIED entries can be sent to stores');

    const updated = await this.prisma.gateInwardEntry.update({
      where: { id },
      data: { status: GateInwardStatus.SENT_TO_STORES, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'VERIFIED' }, newValues: { status: 'SENT_TO_STORES' }, changedBy: user.id });
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
      vehicleLog: { select: { id: true, logNumber: true, vehicle: { select: { vehicleNumber: true } } } },
    };
  }
}
