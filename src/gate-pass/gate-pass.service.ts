import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import {
  CreateGatePassDto,
  ApproveGatePassDto,
  CancelGatePassDto,
  ReturnGatePassDto,
} from './dto/gate-pass.dto';
import { GatePassStatus } from '@prisma/client';

@Injectable()
export class GatePassService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private settings: SettingsService,
  ) {}

  async create(dto: CreateGatePassDto, user: any) {
    const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
    if (!plant) throw new NotFoundException('Plant not found');

    if (dto.type === 'STAFF_EXIT' && !dto.employeeId) {
      throw new BadRequestException('Employee ID is required for staff exit pass');
    }

    let passNumber: string;
    try {
      passNumber = await this.settings.getNextNumber(user.companyId, 'GP');
    } catch {
      const count = await this.prisma.gatePass.count({ where: { companyId: user.companyId } });
      const now = new Date();
      const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      passNumber = `GP-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
    }

    const pass = await this.prisma.gatePass.create({
      data: {
        passNumber,
        companyId:          user.companyId,
        plantId:            dto.plantId,
        type:               dto.type,
        purpose:            dto.purpose,
        carrierName:        dto.carrierName,
        carrierMobile:      dto.carrierMobile,
        carrierIdProof:     dto.carrierIdProof,
        vehicleNumber:      dto.vehicleNumber,
        itemDescription:    dto.itemDescription,
        quantity:           dto.quantity,
        unit:               dto.unit ?? 'NOS',
        estimatedValue:     dto.estimatedValue,
        validFrom:          dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo:            dto.validTo ? new Date(dto.validTo) : undefined,
        remarks:            dto.remarks,
        employeeId:         dto.employeeId,
        exitType:           dto.exitType,
        expectedReturnTime: dto.expectedReturnTime ? new Date(dto.expectedReturnTime) : undefined,
        departmentName:     dto.departmentName,
        requestedById:      user.id,
        createdBy:          user.id,
        updatedBy:          user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'gate_passes', recordId: pass.id, action: 'CREATE', newValues: { passNumber, type: dto.type }, changedBy: user.id });
    return pass;
  }

  async findAll(user: any, filters: { status?: GatePassStatus; type?: string; plantId?: string; search?: string }) {
    const where: any = { companyId: user.companyId };
    if (filters.status)  where.status  = filters.status;
    if (filters.type)    where.type    = filters.type;
    if (filters.plantId) where.plantId = filters.plantId;
    if (filters.search) {
      where.OR = [
        { passNumber:      { contains: filters.search, mode: 'insensitive' } },
        { carrierName:     { contains: filters.search, mode: 'insensitive' } },
        { itemDescription: { contains: filters.search, mode: 'insensitive' } },
        { purpose:         { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.gatePass.findMany({ where, include: this.includes(), orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const pass = await this.prisma.gatePass.findUnique({ where: { id }, include: this.includes() });
    if (!pass) throw new NotFoundException('Gate pass not found');
    return pass;
  }

  async approve(id: string, dto: ApproveGatePassDto, user: any) {
    const pass = await this.prisma.gatePass.findUnique({ where: { id } });
    if (!pass) throw new NotFoundException('Gate pass not found');
    if (pass.status !== GatePassStatus.PENDING) throw new BadRequestException('Only PENDING passes can be approved');

    const updated = await this.prisma.gatePass.update({
      where: { id },
      data: { status: GatePassStatus.APPROVED, authorizedById: user.id, authorizedAt: new Date(), remarks: dto.remarks || pass.remarks, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_passes', recordId: id, action: 'UPDATE', oldValues: { status: 'PENDING' }, newValues: { status: 'APPROVED' }, changedBy: user.id });
    return updated;
  }

  async issue(id: string, user: any) {
    const pass = await this.prisma.gatePass.findUnique({ where: { id } });
    if (!pass) throw new NotFoundException('Gate pass not found');
    if (pass.status !== GatePassStatus.APPROVED) throw new BadRequestException('Only APPROVED passes can be issued');

    const updated = await this.prisma.gatePass.update({
      where: { id },
      data: { status: GatePassStatus.ISSUED, issuedById: user.id, issuedAt: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_passes', recordId: id, action: 'UPDATE', oldValues: { status: 'APPROVED' }, newValues: { status: 'ISSUED' }, changedBy: user.id });
    return updated;
  }

  async markReturned(id: string, dto: ReturnGatePassDto, user: any) {
    const pass = await this.prisma.gatePass.findUnique({ where: { id } });
    if (!pass) throw new NotFoundException('Gate pass not found');
    if (pass.status !== GatePassStatus.ISSUED) throw new BadRequestException('Only ISSUED passes can be marked returned');
    if (!['RETURNABLE','STAFF_EXIT'].includes(pass.type)) throw new BadRequestException('Only RETURNABLE or STAFF_EXIT passes can be marked returned');

    const updated = await this.prisma.gatePass.update({
      where: { id },
      data: {
        status: GatePassStatus.RETURNED,
        returnedAt: new Date(),
        actualReturnTime: new Date(),
        remarks: dto.remarks || pass.remarks,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_passes', recordId: id, action: 'UPDATE', oldValues: { status: 'ISSUED' }, newValues: { status: 'RETURNED' }, changedBy: user.id });
    return updated;
  }

  async close(id: string, user: any) {
    const pass = await this.prisma.gatePass.findUnique({ where: { id } });
    if (!pass) throw new NotFoundException('Gate pass not found');
    if (!['ISSUED', 'RETURNED'].includes(pass.status)) throw new BadRequestException('Only ISSUED or RETURNED passes can be closed');

    const updated = await this.prisma.gatePass.update({
      where: { id },
      data: { status: GatePassStatus.CLOSED, closedById: user.id, closedAt: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_passes', recordId: id, action: 'UPDATE', oldValues: { status: pass.status }, newValues: { status: 'CLOSED' }, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, dto: CancelGatePassDto, user: any) {
    const pass = await this.prisma.gatePass.findUnique({ where: { id } });
    if (!pass) throw new NotFoundException('Gate pass not found');
    if (['ISSUED', 'CLOSED', 'CANCELLED'].includes(pass.status)) throw new BadRequestException(`Cannot cancel a ${pass.status} pass`);

    const updated = await this.prisma.gatePass.update({
      where: { id },
      data: { status: GatePassStatus.CANCELLED, cancelReason: dto.cancelReason, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_passes', recordId: id, action: 'UPDATE', oldValues: { status: pass.status }, newValues: { status: 'CANCELLED' }, changedBy: user.id });
    return updated;
  }

  async getStats(user: any) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const base = { companyId: user.companyId };

    const [total, pending, approved, issued, returned, closed, cancelled, returnable, nonReturnable, staffExit] = await Promise.all([
      this.prisma.gatePass.count({ where: base }),
      this.prisma.gatePass.count({ where: { ...base, status: 'PENDING' } }),
      this.prisma.gatePass.count({ where: { ...base, status: 'APPROVED' } }),
      this.prisma.gatePass.count({ where: { ...base, status: 'ISSUED' } }),
      this.prisma.gatePass.count({ where: { ...base, status: 'RETURNED' } }),
      this.prisma.gatePass.count({ where: { ...base, status: 'CLOSED' } }),
      this.prisma.gatePass.count({ where: { ...base, status: 'CANCELLED' } }),
      this.prisma.gatePass.count({ where: { ...base, type: 'RETURNABLE' } }),
      this.prisma.gatePass.count({ where: { ...base, type: 'NON_RETURNABLE' } }),
      this.prisma.gatePass.count({ where: { ...base, type: 'STAFF_EXIT' } }),
    ]);

    return { total, pending, approved, issued, returned, closed, cancelled, returnable, nonReturnable, staffExit };
  }

  private includes() {
    return {
      plant:        { select: { id: true, name: true, code: true } },
      requestedBy:  { select: { id: true, firstName: true, lastName: true } },
      authorizedBy: { select: { id: true, firstName: true, lastName: true } },
      issuedBy:     { select: { id: true, firstName: true, lastName: true } },
      closedBy:     { select: { id: true, firstName: true, lastName: true } },
      employee:     { select: { id: true, firstName: true, lastName: true, employeeCode: true, role: true } },
    };
  }
}
