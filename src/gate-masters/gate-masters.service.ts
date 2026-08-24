import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import {
  CreateGateTypeDto, UpdateGateTypeDto, CreateGateDto, UpdateGateDto,
  CreateParkingAreaDto, UpdateParkingAreaDto, CreateParkingSlotDto, UpdateParkingSlotDto,
  CreateVisitPurposeDto, UpdateVisitPurposeDto,
  CreateGatePassTypeMasterDto, UpdateGatePassTypeMasterDto,
  CreateSecurityReasonDto, UpdateSecurityReasonDto,
} from './dto/gate-masters.dto';

@Injectable()
export class GateMastersService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ---- Gate Types ----
  async createGateType(dto: CreateGateTypeDto, user: any) {
    const gt = await this.prisma.gateType.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
    await this.audit.log({ tableName: 'gate_types', recordId: gt.id, action: 'CREATE', newValues: gt, changedBy: user.id });
    return gt;
  }
  findAllGateTypes(user: any) {
    return this.prisma.gateType.findMany({ where: { companyId: user.companyId, isActive: true }, orderBy: { name: 'asc' } });
  }
  async updateGateType(id: string, dto: UpdateGateTypeDto, user: any) {
    const gt = await this.prisma.gateType.findFirst({ where: { id, companyId: user.companyId } });
    if (!gt) throw new NotFoundException('Gate type not found');
    const updated = await this.prisma.gateType.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'gate_types', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // ---- Gates ----
  async createGate(dto: CreateGateDto, user: any) {
    const plant = await this.prisma.plant.findFirst({ where: { id: dto.plantId, companyId: user.companyId } });
    if (!plant) throw new NotFoundException('Plant not found');
    const gate = await this.prisma.gate.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
    await this.audit.log({ tableName: 'gates', recordId: gate.id, action: 'CREATE', newValues: gate, changedBy: user.id });
    return gate;
  }
  findAllGates(user: any, plantId?: string) {
    const where: any = { companyId: user.companyId, isActive: true };
    if (plantId) where.plantId = plantId;
    return this.prisma.gate.findMany({ where, include: { gateType: true, plant: { select: { id: true, name: true, code: true } } }, orderBy: { name: 'asc' } });
  }
  async updateGate(id: string, dto: UpdateGateDto, user: any) {
    const gate = await this.prisma.gate.findFirst({ where: { id, companyId: user.companyId } });
    if (!gate) throw new NotFoundException('Gate not found');
    const updated = await this.prisma.gate.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'gates', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // ---- Parking Areas ----
  async createParkingArea(dto: CreateParkingAreaDto, user: any) {
    const plant = await this.prisma.plant.findFirst({ where: { id: dto.plantId, companyId: user.companyId } });
    if (!plant) throw new NotFoundException('Plant not found');
    const area = await this.prisma.parkingArea.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
    await this.audit.log({ tableName: 'parking_areas', recordId: area.id, action: 'CREATE', newValues: area, changedBy: user.id });
    return area;
  }
  async findAllParkingAreas(user: any, plantId?: string) {
    const where: any = { companyId: user.companyId, isActive: true };
    if (plantId) where.plantId = plantId;
    const areas = await this.prisma.parkingArea.findMany({
      where, orderBy: { name: 'asc' },
      include: { _count: { select: { slots: { where: { isActive: true } } } }, slots: { where: { isActive: true }, select: { isOccupied: true } } },
    });
    return areas.map(a => ({
      ...a,
      occupiedSlots: a.slots.filter(s => s.isOccupied).length,
      totalActiveSlots: a.slots.length,
      slots: undefined,
    }));
  }
  async updateParkingArea(id: string, dto: UpdateParkingAreaDto, user: any) {
    const area = await this.prisma.parkingArea.findFirst({ where: { id, companyId: user.companyId } });
    if (!area) throw new NotFoundException('Parking area not found');
    const updated = await this.prisma.parkingArea.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'parking_areas', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // ---- Parking Slots ----
  async createParkingSlot(dto: CreateParkingSlotDto, user: any) {
    const area = await this.prisma.parkingArea.findFirst({ where: { id: dto.parkingAreaId, companyId: user.companyId } });
    if (!area) throw new NotFoundException('Parking area not found');
    const slot = await this.prisma.parkingSlot.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
    await this.audit.log({ tableName: 'parking_slots', recordId: slot.id, action: 'CREATE', newValues: slot, changedBy: user.id });
    return slot;
  }
  findAllParkingSlots(user: any, parkingAreaId?: string) {
    const where: any = { companyId: user.companyId, isActive: true };
    if (parkingAreaId) where.parkingAreaId = parkingAreaId;
    return this.prisma.parkingSlot.findMany({
      where, orderBy: { slotCode: 'asc' },
      include: { currentVehicleLog: { select: { id: true, vehicle: { select: { vehicleNumber: true } }, driverName: true, entryTime: true } } },
    });
  }
  async updateParkingSlot(id: string, dto: UpdateParkingSlotDto, user: any) {
    const slot = await this.prisma.parkingSlot.findFirst({ where: { id, companyId: user.companyId } });
    if (!slot) throw new NotFoundException('Parking slot not found');
    const updated = await this.prisma.parkingSlot.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'parking_slots', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // ---- Visit Purposes ----
  async createVisitPurpose(dto: CreateVisitPurposeDto, user: any) {
    const vp = await this.prisma.visitPurpose.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
    await this.audit.log({ tableName: 'visit_purposes', recordId: vp.id, action: 'CREATE', newValues: vp, changedBy: user.id });
    return vp;
  }
  findAllVisitPurposes(user: any) {
    return this.prisma.visitPurpose.findMany({ where: { companyId: user.companyId, isActive: true }, orderBy: { name: 'asc' } });
  }
  async updateVisitPurpose(id: string, dto: UpdateVisitPurposeDto, user: any) {
    const vp = await this.prisma.visitPurpose.findFirst({ where: { id, companyId: user.companyId } });
    if (!vp) throw new NotFoundException('Visit purpose not found');
    const updated = await this.prisma.visitPurpose.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'visit_purposes', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // ---- Gate Pass Type Masters ----
  private readonly VALID_MAPS_TO = ['RETURNABLE', 'NON_RETURNABLE', 'STAFF_EXIT'];
  async createGatePassTypeMaster(dto: CreateGatePassTypeMasterDto, user: any) {
    if (!this.VALID_MAPS_TO.includes(dto.mapsToType)) {
      throw new BadRequestException(`mapsToType must be one of ${this.VALID_MAPS_TO.join(', ')}`);
    }
    const t = await this.prisma.gatePassTypeMaster.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
    await this.audit.log({ tableName: 'gate_pass_type_masters', recordId: t.id, action: 'CREATE', newValues: t, changedBy: user.id });
    return t;
  }
  findAllGatePassTypeMasters(user: any) {
    return this.prisma.gatePassTypeMaster.findMany({ where: { companyId: user.companyId, isActive: true }, orderBy: { name: 'asc' } });
  }
  async updateGatePassTypeMaster(id: string, dto: UpdateGatePassTypeMasterDto, user: any) {
    if (dto.mapsToType && !this.VALID_MAPS_TO.includes(dto.mapsToType)) {
      throw new BadRequestException(`mapsToType must be one of ${this.VALID_MAPS_TO.join(', ')}`);
    }
    const t = await this.prisma.gatePassTypeMaster.findFirst({ where: { id, companyId: user.companyId } });
    if (!t) throw new NotFoundException('Gate pass type not found');
    const updated = await this.prisma.gatePassTypeMaster.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'gate_pass_type_masters', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // ---- Security Reasons ----
  async createSecurityReason(dto: CreateSecurityReasonDto, user: any) {
    const sr = await this.prisma.securityReason.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
    await this.audit.log({ tableName: 'security_reasons', recordId: sr.id, action: 'CREATE', newValues: sr, changedBy: user.id });
    return sr;
  }
  findAllSecurityReasons(user: any) {
    return this.prisma.securityReason.findMany({ where: { companyId: user.companyId, isActive: true }, orderBy: { name: 'asc' } });
  }
  async updateSecurityReason(id: string, dto: UpdateSecurityReasonDto, user: any) {
    const sr = await this.prisma.securityReason.findFirst({ where: { id, companyId: user.companyId } });
    if (!sr) throw new NotFoundException('Security reason not found');
    const updated = await this.prisma.securityReason.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'security_reasons', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }
}
