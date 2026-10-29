import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateTrackingUpdateDto, UpdateTrackingUpdateDto } from './dto/dispatch-tracking.dto';

@Injectable()
export class DispatchTrackingService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async getGateOut(gateOutId: string, user: any) {
    const gateOut = await this.prisma.dispatchGateOut.findFirst({
      where: { id: gateOutId, companyId: user.companyId },
      select: { id: true, gateOutNumber: true, companyId: true, soId: true, customerName: true, vehicleNumber: true },
    });
    if (!gateOut) throw new NotFoundException('Gate-Out not found');
    return gateOut;
  }

  private async getTrackingUpdate(id: string, user: any) {
    const update = await this.prisma.dispatchTrackingUpdate.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!update) throw new NotFoundException('Tracking update not found');
    return update;
  }

  // DSP-015: manual entry only today - source is always 'MANUAL' and
  // enteredBy is always the authenticated Dispatch-role user. A future
  // carrier webhook/lookup integration writes into this exact same
  // table with source set to 'CARRIER_WEBHOOK' / 'CARRIER_LOOKUP',
  // enteredBy left null, and carrierReference/rawPayload populated -
  // no schema change required.
  async create(dto: CreateTrackingUpdateDto, user: any) {
    const gateOut = await this.getGateOut(dto.gateOutId, user);

    const update = await this.prisma.dispatchTrackingUpdate.create({
      data: {
        companyId: user.companyId,
        gateOutId: gateOut.id,
        status: dto.status,
        location: dto.location,
        notes: dto.notes,
        eventAt: dto.eventAt ? new Date(dto.eventAt) : new Date(),
        source: 'MANUAL',
        enteredBy: user.id,
        carrierReference: dto.carrierReference,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    await this.audit.log({ tableName: 'dispatch_tracking_updates', recordId: update.id, action: 'CREATE', newValues: update, changedBy: user.id });
    return update;
  }

  async update(id: string, dto: UpdateTrackingUpdateDto, user: any) {
    const existing = await this.getTrackingUpdate(id, user);

    const updated = await this.prisma.dispatchTrackingUpdate.update({
      where: { id: existing.id },
      data: {
        status: dto.status ?? existing.status,
        location: dto.location ?? existing.location,
        notes: dto.notes ?? existing.notes,
        eventAt: dto.eventAt ? new Date(dto.eventAt) : existing.eventAt,
        carrierReference: dto.carrierReference ?? existing.carrierReference,
        updatedBy: user.id,
      },
    });

    await this.audit.log({ tableName: 'dispatch_tracking_updates', recordId: updated.id, action: 'UPDATE', oldValues: existing, newValues: updated, changedBy: user.id });
    return updated;
  }

  // Full timeline for a shipment, oldest first - this is a log, not a
  // mutable single status, so every IN_TRANSIT -> DELAYED -> IN_TRANSIT
  // -> DELIVERED hop stays visible, with the latest entry surfaced
  // separately as currentStatus for convenience.
  async findTimeline(gateOutId: string, user: any) {
    const gateOut = await this.getGateOut(gateOutId, user);

    const timeline = await this.prisma.dispatchTrackingUpdate.findMany({
      where: { gateOutId: gateOut.id, companyId: user.companyId, isActive: true },
      orderBy: [{ eventAt: 'asc' }, { createdAt: 'asc' }],
    });

    const latest = timeline.length > 0 ? timeline[timeline.length - 1] : null;

    return {
      gateOutId: gateOut.id,
      gateOutNumber: gateOut.gateOutNumber,
      customerName: gateOut.customerName,
      vehicleNumber: gateOut.vehicleNumber,
      currentStatus: latest?.status ?? null,
      timeline,
    };
  }

  async findOne(id: string, user: any) {
    return this.getTrackingUpdate(id, user);
  }
}
