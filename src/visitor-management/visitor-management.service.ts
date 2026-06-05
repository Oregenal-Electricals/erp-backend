import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import {
  CreateVisitorDto,
  UpdateVisitorDto,
  CheckInVisitorDto,
  CheckOutVisitorDto,
} from './dto/visitor.dto';
import { VisitorStatus } from '@prisma/client';

@Injectable()
export class VisitorManagementService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private settings: SettingsService,
  ) {}

  // ─────────────────────────────────────────────
  // VISITOR MASTER
  // ─────────────────────────────────────────────

  async createVisitor(dto: CreateVisitorDto, user: any) {
    const visitor = await this.prisma.visitor.create({
      data: {
        ...dto,
        companyId: user.companyId,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    await this.audit.log({
      tableName: 'visitors', recordId: visitor.id,
      action: 'CREATE', newValues: visitor, changedBy: user.id,
    });

    return visitor;
  }

  async findAllVisitors(user: any, search?: string) {
    const where: any = { companyId: user.companyId };
    if (search) {
      where.OR = [
        { firstName:     { contains: search, mode: 'insensitive' } },
        { lastName:      { contains: search, mode: 'insensitive' } },
        { mobile:        { contains: search, mode: 'insensitive' } },
        { idProofNumber: { contains: search, mode: 'insensitive' } },
        { visitorCompany:{ contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.visitor.findMany({
      where,
      include: {
        _count: { select: { logs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneVisitor(id: string) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id },
      include: {
        logs: {
          include: {
            plant:       { select: { id: true, name: true, code: true } },
            hostEmployee:{ select: { id: true, firstName: true, lastName: true } },
            checkedInBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { checkInTime: 'desc' },
          take: 10,
        },
      },
    });
    if (!visitor) throw new NotFoundException('Visitor not found');
    return visitor;
  }

  async updateVisitor(id: string, dto: UpdateVisitorDto, user: any) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found');

    const updated = await this.prisma.visitor.update({
      where: { id },
      data: { ...dto, updatedBy: user.id },
    });

    await this.audit.log({
      tableName: 'visitors', recordId: id,
      action: 'UPDATE', oldValues: visitor, newValues: dto, changedBy: user.id,
    });

    return updated;
  }

  async blacklistVisitor(id: string, reason: string, user: any) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found');

    const updated = await this.prisma.visitor.update({
      where: { id },
      data: { isBlacklisted: !visitor.isBlacklisted, blacklistReason: reason, updatedBy: user.id },
    });

    await this.audit.log({
      tableName: 'visitors', recordId: id,
      action: 'UPDATE',
      newValues: { isBlacklisted: updated.isBlacklisted, reason },
      changedBy: user.id,
      reason: updated.isBlacklisted ? `Blacklisted: ${reason}` : 'Removed from blacklist',
    });

    return updated;
  }

  // ─────────────────────────────────────────────
  // VISITOR LOGS — CHECK IN / OUT
  // ─────────────────────────────────────────────

  async checkIn(dto: CheckInVisitorDto, user: any) {
    // Verify visitor exists
    const visitor = await this.prisma.visitor.findUnique({ where: { id: dto.visitorId } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (visitor.isBlacklisted) throw new BadRequestException(`Visitor is blacklisted: ${visitor.blacklistReason}`);

    // Verify plant exists
    const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
    if (!plant) throw new NotFoundException('Plant not found');

    // Check visitor not already inside
    const alreadyIn = await this.prisma.visitorLog.findFirst({
      where: { visitorId: dto.visitorId, status: VisitorStatus.CHECKED_IN },
    });
    if (alreadyIn) throw new ConflictException('Visitor is already checked in');

    // Generate log number
    let logNumber: string;
    try {
      logNumber = await this.settings.getNextNumber(user.companyId, 'VIS');
    } catch {
      const count = await this.prisma.visitorLog.count({ where: { companyId: user.companyId } });
      const now = new Date();
      const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      logNumber = `VIS-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
    }

    const log = await this.prisma.visitorLog.create({
      data: {
        logNumber,
        companyId:      user.companyId,
        visitorId:      dto.visitorId,
        plantId:        dto.plantId,
        hostEmployeeId: dto.hostEmployeeId,
        checkedInById:  user.id,
        purpose:        dto.purpose,
        vehicleNumber:  dto.vehicleNumber,
        itemsCarried:   dto.itemsCarried,
        areasToVisit:   dto.areasToVisit,
        remarks:        dto.remarks,
        expectedOutTime: dto.expectedOutTime ? new Date(dto.expectedOutTime) : undefined,
        status:         VisitorStatus.CHECKED_IN,
        createdBy:      user.id,
        updatedBy:      user.id,
      },
      include: this.logIncludes(),
    });

    await this.audit.log({
      tableName: 'visitor_logs', recordId: log.id,
      action: 'CREATE',
      newValues: { logNumber, visitorId: dto.visitorId, plantId: dto.plantId },
      changedBy: user.id,
    });

    return log;
  }

  async checkOut(id: string, dto: CheckOutVisitorDto, user: any) {
    const log = await this.prisma.visitorLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Visitor log not found');
    if (log.status !== VisitorStatus.CHECKED_IN) {
      throw new BadRequestException('Visitor is not currently checked in');
    }

    const updated = await this.prisma.visitorLog.update({
      where: { id },
      data: {
        status:         VisitorStatus.CHECKED_OUT,
        checkOutTime:   new Date(),
        checkedOutById: user.id,
        remarks:        dto.remarks || log.remarks,
        updatedBy:      user.id,
      },
      include: this.logIncludes(),
    });

    await this.audit.log({
      tableName: 'visitor_logs', recordId: id,
      action: 'UPDATE',
      oldValues: { status: 'CHECKED_IN' },
      newValues: { status: 'CHECKED_OUT', checkOutTime: new Date() },
      changedBy: user.id,
    });

    return updated;
  }

  async findAllLogs(user: any, filters: {
    plantId?: string;
    status?: VisitorStatus;
    date?: string;
  }) {
    const where: any = { companyId: user.companyId };
    if (filters.plantId) where.plantId = filters.plantId;
    if (filters.status)  where.status  = filters.status;
    if (filters.date) {
      const d = new Date(filters.date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.checkInTime = { gte: d, lt: next };
    }

    return this.prisma.visitorLog.findMany({
      where,
      include: this.logIncludes(),
      orderBy: { checkInTime: 'desc' },
    });
  }

  async getActiveVisitors(user: any) {
    return this.prisma.visitorLog.findMany({
      where: { companyId: user.companyId, status: VisitorStatus.CHECKED_IN },
      include: this.logIncludes(),
      orderBy: { checkInTime: 'asc' },
    });
  }

  async getStats(user: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const base = { companyId: user.companyId };

    const [
      totalVisitors, activeNow, todayIn, todayOut,
      totalLogs, blacklisted,
    ] = await Promise.all([
      this.prisma.visitor.count({ where: base }),
      this.prisma.visitorLog.count({ where: { ...base, status: 'CHECKED_IN' } }),
      this.prisma.visitorLog.count({ where: { ...base, checkInTime: { gte: today, lt: tomorrow } } }),
      this.prisma.visitorLog.count({ where: { ...base, status: 'CHECKED_OUT', checkOutTime: { gte: today, lt: tomorrow } } }),
      this.prisma.visitorLog.count({ where: base }),
      this.prisma.visitor.count({ where: { ...base, isBlacklisted: true } }),
    ]);

    return { totalVisitors, activeNow, todayIn, todayOut, totalLogs, blacklisted };
  }

  // ─────────────────────────────────────────────
  private logIncludes() {
    return {
      visitor:      { select: { id: true, firstName: true, lastName: true, mobile: true, visitorCompany: true, idProofType: true } },
      plant:        { select: { id: true, name: true, code: true } },
      hostEmployee: { select: { id: true, firstName: true, lastName: true } },
      checkedInBy:  { select: { id: true, firstName: true, lastName: true } },
      checkedOutBy: { select: { id: true, firstName: true, lastName: true } },
    };
  }
}
