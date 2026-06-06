import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import {
  CreateGateOutwardDto,
  UpdateGateOutwardDto,
  ApproveGateOutwardDto,
  CancelGateOutwardDto,
} from './dto/gate-outward.dto';
import { GateOutwardStatus } from '@prisma/client';

@Injectable()
export class GateOutwardService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private settings: SettingsService,
  ) {}

  async create(dto: CreateGateOutwardDto, user: any) {
    const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
    if (!plant) throw new NotFoundException('Plant not found');

    let goeNumber: string;
    try {
      goeNumber = await this.settings.getNextNumber(user.companyId, 'GOE');
    } catch {
      const count = await this.prisma.gateOutwardEntry.count({ where: { companyId: user.companyId } });
      const now = new Date();
      const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      goeNumber = `GOE-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
    }

    const entry = await this.prisma.gateOutwardEntry.create({
      data: {
        goeNumber,
        companyId:             user.companyId,
        plantId:               dto.plantId,
        vehicleLogId:          dto.vehicleLogId,
        customerName:          dto.customerName,
        customerMobile:        dto.customerMobile,
        customerAddress:       dto.customerAddress,
        customerGstin:         dto.customerGstin,
        salesOrderNumber:      dto.salesOrderNumber,
        deliveryChallanNumber: dto.deliveryChallanNumber,
        invoiceNumber:         dto.invoiceNumber,
        invoiceAmount:         dto.invoiceAmount,
        materialDescription:   dto.materialDescription,
        quantity:              dto.quantity,
        unit:                  dto.unit ?? 'NOS',
        grossWeight:           dto.grossWeight,
        netWeight:             dto.netWeight,
        packageCount:          dto.packageCount,
        remarks:               dto.remarks,
        createdById:           user.id,
        createdBy:             user.id,
        updatedBy:             user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'gate_outward_entries', recordId: entry.id, action: 'CREATE', newValues: { goeNumber, customerName: dto.customerName }, changedBy: user.id });
    return entry;
  }

  async findAll(user: any, filters: { status?: GateOutwardStatus; plantId?: string; date?: string; search?: string }) {
    const where: any = { companyId: user.companyId };
    if (filters.status)  where.status  = filters.status;
    if (filters.plantId) where.plantId = filters.plantId;
    if (filters.search) {
      where.OR = [
        { goeNumber:           { contains: filters.search, mode: 'insensitive' } },
        { customerName:        { contains: filters.search, mode: 'insensitive' } },
        { salesOrderNumber:    { contains: filters.search, mode: 'insensitive' } },
        { deliveryChallanNumber: { contains: filters.search, mode: 'insensitive' } },
        { materialDescription: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.date) {
      const d = new Date(filters.date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.createdAt = { gte: d, lt: next };
    }
    return this.prisma.gateOutwardEntry.findMany({ where, include: this.includes(), orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const entry = await this.prisma.gateOutwardEntry.findUnique({ where: { id }, include: this.includes() });
    if (!entry) throw new NotFoundException('Gate outward entry not found');
    return entry;
  }

  async update(id: string, dto: UpdateGateOutwardDto, user: any) {
    const entry = await this.prisma.gateOutwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate outward entry not found');
    if (entry.status !== GateOutwardStatus.PENDING) throw new BadRequestException('Only PENDING entries can be updated');

    const updated = await this.prisma.gateOutwardEntry.update({
      where: { id }, data: { ...dto, updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_outward_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: dto, changedBy: user.id });
    return updated;
  }

  async approve(id: string, dto: ApproveGateOutwardDto, user: any) {
    const entry = await this.prisma.gateOutwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate outward entry not found');
    if (entry.status !== GateOutwardStatus.PENDING) throw new BadRequestException('Only PENDING entries can be approved');

    const updated = await this.prisma.gateOutwardEntry.update({
      where: { id },
      data: { status: GateOutwardStatus.APPROVED, authorizedById: user.id, authorizedAt: new Date(), remarks: dto.remarks || entry.remarks, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_outward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'PENDING' }, newValues: { status: 'APPROVED' }, changedBy: user.id });
    return updated;
  }

  async dispatch(id: string, user: any) {
    const entry = await this.prisma.gateOutwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate outward entry not found');
    if (entry.status !== GateOutwardStatus.APPROVED) throw new BadRequestException('Only APPROVED entries can be dispatched');

    const updated = await this.prisma.gateOutwardEntry.update({
      where: { id },
      data: { status: GateOutwardStatus.DISPATCHED, dispatchedById: user.id, dispatchedAt: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_outward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'APPROVED' }, newValues: { status: 'DISPATCHED' }, changedBy: user.id });
    return updated;
  }

  async markDelivered(id: string, user: any) {
    const entry = await this.prisma.gateOutwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate outward entry not found');
    if (entry.status !== GateOutwardStatus.DISPATCHED) throw new BadRequestException('Only DISPATCHED entries can be marked delivered');

    const updated = await this.prisma.gateOutwardEntry.update({
      where: { id },
      data: { status: GateOutwardStatus.DELIVERED, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_outward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'DISPATCHED' }, newValues: { status: 'DELIVERED' }, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, dto: CancelGateOutwardDto, user: any) {
    const entry = await this.prisma.gateOutwardEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Gate outward entry not found');
    if (['DISPATCHED', 'DELIVERED', 'CANCELLED'].includes(entry.status)) throw new BadRequestException(`Cannot cancel a ${entry.status} entry`);

    const updated = await this.prisma.gateOutwardEntry.update({
      where: { id },
      data: { status: GateOutwardStatus.CANCELLED, cancelReason: dto.cancelReason, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_outward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'CANCELLED' }, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const base = { companyId: user.companyId };

    const [total, pending, approved, dispatched, delivered, cancelled, todayOut] = await Promise.all([
      this.prisma.gateOutwardEntry.count({ where: base }),
      this.prisma.gateOutwardEntry.count({ where: { ...base, status: 'PENDING' } }),
      this.prisma.gateOutwardEntry.count({ where: { ...base, status: 'APPROVED' } }),
      this.prisma.gateOutwardEntry.count({ where: { ...base, status: 'DISPATCHED' } }),
      this.prisma.gateOutwardEntry.count({ where: { ...base, status: 'DELIVERED' } }),
      this.prisma.gateOutwardEntry.count({ where: { ...base, status: 'CANCELLED' } }),
      this.prisma.gateOutwardEntry.count({ where: { ...base, createdAt: { gte: today, lt: tomorrow } } }),
    ]);

    return { total, pending, approved, dispatched, delivered, cancelled, todayOut };
  }

  private includes() {
    return {
      plant:         { select: { id: true, name: true, code: true } },
      createdByUser: { select: { id: true, firstName: true, lastName: true } },
      authorizedBy:  { select: { id: true, firstName: true, lastName: true } },
      dispatchedBy:  { select: { id: true, firstName: true, lastName: true } },
      vehicleLog:    { select: { id: true, logNumber: true, vehicle: { select: { vehicleNumber: true } } } },
    };
  }
}
