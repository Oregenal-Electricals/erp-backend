import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { PauseDto, ResumeDto } from './dto/downtime.dto';

@Injectable()
export class DowntimeService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private includes() {
    return {
      workOrder: { select: { id: true, woNumber: true, stageName: true, status: true } },
      startedBy: { select: { firstName: true, lastName: true } },
      resumedBy: { select: { firstName: true, lastName: true } },
    };
  }

  // PROD-011: exact start/end timestamps are mandatory (spec section 7)
  // - duration is always derived from them, never trusted as a typed
  // number, since costing/audit/overlap-checking all depend on it.
  async pause(dto: PauseDto, user: any) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
    if (!wo) throw new NotFoundException('Work order not found');
    if (wo.status !== 'IN_PROGRESS') throw new BadRequestException('Only an IN_PROGRESS Work Order can be paused');

    // Duplicate/overlapping pause control (spec section 24) - one
    // Production Session should not have two concurrent open downtimes.
    const existing = await this.prisma.downtime.findFirst({
      where: { workOrderId: dto.workOrderId, companyId: user.companyId, status: 'OPEN', isActive: true },
    });
    if (existing) {
      throw new BadRequestException(`Production is already paused since ${existing.startTime.toISOString()}`);
    }

    const startTime = dto.startTime ? new Date(dto.startTime) : new Date();

    const downtime = await this.prisma.downtime.create({
      data: {
        companyId: user.companyId, workOrderId: dto.workOrderId,
        reason: dto.reason, category: dto.category || 'OTHER',
        startTime, status: 'OPEN', startedByUserId: user.id, remarks: dto.remarks,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    // PAUSED does not mean completion (spec section 4) - only
    // stageStatus moves, WO status, quantities, and WIP are untouched.
    await this.prisma.workOrder.update({ where: { id: dto.workOrderId }, data: { stageStatus: 'PAUSED', updatedBy: user.id } });

    await this.audit.log({ tableName: 'downtimes', recordId: downtime.id, action: 'CREATE', newValues: downtime, changedBy: user.id });
    return downtime;
  }

  async resume(id: string, dto: ResumeDto, user: any) {
    const downtime = await this.prisma.downtime.findFirst({ where: { id, companyId: user.companyId } });
    if (!downtime) throw new NotFoundException('Downtime record not found');
    if (downtime.status !== 'OPEN') throw new BadRequestException('This downtime has already been resumed');

    const endTime = dto.endTime ? new Date(dto.endTime) : new Date();
    if (endTime <= downtime.startTime) throw new BadRequestException('Resume time must be after pause time');

    // Zero-manpower resume blocked (spec sections 34, 44) - reuses the
    // same STAGE_TO_LINE total PROD-010's MANPOWER_HOLD is built on,
    // so a manual-stage resume can never proceed with no one assigned.
    const activeManpower = await this.prisma.manpowerAllocation.aggregate({
      where: { companyId: user.companyId, workOrderId: downtime.workOrderId, level: 'STAGE_TO_LINE', isActive: true, status: { not: 'REJECTED' } },
      _sum: { count: true },
    });
    if ((activeManpower._sum.count || 0) <= 0) {
      throw new BadRequestException('No active manpower available for this Work Order - restore manpower before resuming production');
    }

    const updated = await this.prisma.downtime.update({
      where: { id },
      data: { endTime, status: 'CLOSED', resumedByUserId: user.id, remarks: dto.remarks || downtime.remarks, updatedBy: user.id },
      include: this.includes(),
    });

    await this.prisma.workOrder.update({ where: { id: downtime.workOrderId }, data: { stageStatus: 'IN_PRODUCTION', updatedBy: user.id } });

    await this.audit.log({
      tableName: 'downtimes', recordId: id, action: 'UPDATE',
      oldValues: { status: 'OPEN' }, newValues: { status: 'CLOSED', endTime, durationMinutes: Math.round((endTime.getTime() - downtime.startTime.getTime()) / 60000) },
      changedBy: user.id,
    });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { workOrderId, status } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (workOrderId) where.workOrderId = workOrderId;
    if (status) where.status = status;
    return this.prisma.downtime.findMany({ where, include: this.includes(), orderBy: { startTime: 'desc' } });
  }

  // Cumulative downtime across separate, non-overlapping records (spec
  // sections 46, 66) - simple sum since overlap is already prevented
  // at pause() time, so nothing here needs interval merging.
  async getCumulativeDowntime(workOrderId: string, user: any) {
    const records = await this.prisma.downtime.findMany({
      where: { companyId: user.companyId, workOrderId, status: 'CLOSED', isActive: true },
    });
    const totalMinutes = records.reduce((sum, d) => sum + (d.endTime ? Math.round((d.endTime.getTime() - d.startTime.getTime()) / 60000) : 0), 0);
    return { workOrderId, downtimeCount: records.length, totalMinutes };
  }
}
