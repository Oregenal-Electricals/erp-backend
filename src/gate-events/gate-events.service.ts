import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateGateEventDto, CorrectGateEventDto } from './dto/gate-event.dto';

@Injectable()
export class GateEventsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private includes() {
    return {
      gate: { select: { id: true, code: true, name: true } },
      vehicle: { select: { id: true, vehicleNumber: true, vehicleType: true } },
      securityUser: { select: { id: true, firstName: true, lastName: true } },
      correctionOfEvent: { select: { id: true, eventType: true, eventTime: true } },
    };
  }

  async create(dto: CreateGateEventDto, user: any) {
    const plant = await this.prisma.plant.findFirst({ where: { id: dto.plantId, companyId: user.companyId } });
    if (!plant) throw new NotFoundException('Plant not found');
    const event = await this.prisma.gateEvent.create({
      data: {
        companyId: user.companyId,
        plantId: dto.plantId,
        gateId: dto.gateId,
        eventType: dto.eventType,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        personId: dto.personId,
        personName: dto.personName,
        vehicleId: dto.vehicleId,
        vehicleNumber: dto.vehicleNumber,
        eventTime: dto.eventTime ? new Date(dto.eventTime) : new Date(),
        securityUserId: user.id,
        source: dto.source || 'MANUAL',
        remarks: dto.remarks,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_events', recordId: event.id, action: 'CREATE', newValues: event, changedBy: user.id });
    return event;
  }

  async findAll(user: any, query: any) {
    const { plantId, gateId, eventType, personId, vehicleId, dateFrom, dateTo, limit } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (plantId) where.plantId = plantId;
    if (gateId) where.gateId = gateId;
    if (eventType) where.eventType = eventType;
    if (personId) where.personId = personId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (dateFrom || dateTo) {
      where.eventTime = {};
      if (dateFrom) where.eventTime.gte = new Date(dateFrom);
      if (dateTo) where.eventTime.lte = new Date(dateTo);
    }
    return this.prisma.gateEvent.findMany({
      where, include: this.includes(), orderBy: { eventTime: 'desc' },
      take: limit ? parseInt(limit, 10) : 100,
    });
  }

  async findOne(id: string, user: any) {
    const event = await this.prisma.gateEvent.findFirst({
      where: { id, companyId: user.companyId },
      include: { ...this.includes(), corrections: { include: this.includes() } },
    });
    if (!event) throw new NotFoundException('Gate event not found');
    return event;
  }

  // Corrections are new rows referencing what they correct - the
  // original event is never edited or deleted, preserving full
  // history either way (spec: gate events must be immutable).
  async correct(id: string, dto: CorrectGateEventDto, user: any) {
    const original = await this.prisma.gateEvent.findFirst({ where: { id, companyId: user.companyId } });
    if (!original) throw new NotFoundException('Gate event not found');
    const correction = await this.prisma.gateEvent.create({
      data: {
        companyId: user.companyId,
        plantId: original.plantId,
        gateId: original.gateId,
        eventType: dto.eventType,
        referenceType: dto.referenceType ?? original.referenceType,
        referenceId: dto.referenceId ?? original.referenceId,
        personId: dto.personId ?? original.personId,
        personName: dto.personName ?? original.personName,
        vehicleId: dto.vehicleId ?? original.vehicleId,
        vehicleNumber: dto.vehicleNumber ?? original.vehicleNumber,
        eventTime: new Date(),
        securityUserId: user.id,
        source: 'MANUAL',
        remarks: dto.remarks,
        correctionOfEventId: original.id,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'gate_events', recordId: correction.id, action: 'CREATE', newValues: { correctionOf: original.id, ...correction }, changedBy: user.id });
    return correction;
  }
}
