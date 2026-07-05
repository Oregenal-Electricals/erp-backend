import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateLeaveTypeDto, AllocateLeaveDto, ApplyLeaveDto, ApproveLeaveDto } from './dto/leave.dto';

@Injectable()
export class LeaveManagementService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateAppNumber(companyId: string): Promise<string> {
    const count = await this.prisma.leaveApplication.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `LA-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private calculateDays(fromDate: string, toDate: string): number {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diff = Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;
    return Math.max(1, diff);
  }

  // ─── LEAVE TYPES ─────────────────────────────────────────────────────────

  async createLeaveType(dto: CreateLeaveTypeDto, user: any) {
    const existing = await this.prisma.leaveType.findUnique({ where: { companyId_code: { companyId: user.companyId, code: dto.code } } });
    if (existing) throw new BadRequestException(`Leave type ${dto.code} already exists`);
    const lt = await this.prisma.leaveType.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
    await this.audit.log({ tableName: 'leave_types', recordId: lt.id, action: 'CREATE', newValues: lt, changedBy: user.id });
    return lt;
  }

  async updateLeaveType(id: string, dto: any, user: any) {
    const lt = await this.prisma.leaveType.findFirst({ where: { id, companyId: user.companyId } });
    if (!lt) throw new NotFoundException('Leave type not found');
    const updated = await this.prisma.leaveType.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'leave_types', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAllLeaveTypes(user: any) {
    return this.prisma.leaveType.findMany({ where: { companyId: user.companyId, isActive: true }, orderBy: { name: 'asc' } });
  }

  // ─── LEAVE BALANCES ───────────────────────────────────────────────────────

  async allocateLeave(dto: AllocateLeaveDto, user: any) {
    const emp = await this.prisma.employee.findFirst({ where: { id: dto.employeeId, companyId: user.companyId } });
    if (!emp) throw new NotFoundException('Employee not found');
    const lt = await this.prisma.leaveType.findFirst({ where: { id: dto.leaveTypeId, companyId: user.companyId } });
    if (!lt) throw new NotFoundException('Leave type not found');

    const existing = await this.prisma.leaveBalance.findUnique({
      where: { companyId_employeeId_leaveTypeId_year: { companyId: user.companyId, employeeId: dto.employeeId, leaveTypeId: dto.leaveTypeId, year: dto.year } },
    });

    const carryForward = dto.carryForward || 0;
    const allocated = dto.allocated + carryForward;

    if (existing) {
      const updated = await this.prisma.leaveBalance.update({
        where: { id: existing.id },
        data: { allocated, carryForward, available: allocated - existing.used - existing.pending, updatedBy: user.id },
      });
      return updated;
    }

    const balance = await this.prisma.leaveBalance.create({
      data: { companyId: user.companyId, employeeId: dto.employeeId, leaveTypeId: dto.leaveTypeId, year: dto.year, allocated, carryForward, used: 0, pending: 0, available: allocated, createdBy: user.id, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'leave_balances', recordId: balance.id, action: 'CREATE', newValues: balance, changedBy: user.id });
    return balance;
  }

  async bulkAllocate(leaveTypeId: string, year: number, user: any) {
    const lt = await this.prisma.leaveType.findFirst({ where: { id: leaveTypeId, companyId: user.companyId } });
    if (!lt) throw new NotFoundException('Leave type not found');

    const employees = await this.prisma.employee.findMany({
      where: { companyId: user.companyId, isActive: true, status: 'ACTIVE',
        ...(lt.applicableGender !== 'ALL' && { gender: lt.applicableGender }),
      },
    });

    let created = 0, updated = 0;
    for (const emp of employees) {
      const existing = await this.prisma.leaveBalance.findUnique({
        where: { companyId_employeeId_leaveTypeId_year: { companyId: user.companyId, employeeId: emp.id, leaveTypeId, year } },
      });
      if (existing) { updated++; continue; }
      await this.prisma.leaveBalance.create({
        data: { companyId: user.companyId, employeeId: emp.id, leaveTypeId, year, allocated: lt.daysAllowed, carryForward: 0, used: 0, pending: 0, available: lt.daysAllowed, createdBy: user.id, updatedBy: user.id },
      });
      created++;
    }
    return { message: `Allocated ${lt.name} for ${year}`, created, updated, total: employees.length };
  }

  async getEmployeeBalances(employeeId: string, year: number, user: any) {
    return this.prisma.leaveBalance.findMany({
      where: { companyId: user.companyId, employeeId, year },
      include: { leaveType: { select: { name: true, code: true, isPaid: true } } },
      orderBy: { leaveType: { name: 'asc' } },
    });
  }

  // ─── LEAVE APPLICATIONS ───────────────────────────────────────────────────

  async applyLeave(dto: ApplyLeaveDto, user: any) {
    const emp = await this.prisma.employee.findFirst({ where: { companyId: user.companyId, userId: user.id } });
    if (!emp) throw new BadRequestException('Employee record not found for this user');

    const lt = await this.prisma.leaveType.findFirst({ where: { id: dto.leaveTypeId, companyId: user.companyId } });
    if (!lt) throw new NotFoundException('Leave type not found');

    const days = this.calculateDays(dto.fromDate, dto.toDate);
    const year = new Date(dto.fromDate).getFullYear();

    // Check balance
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { companyId_employeeId_leaveTypeId_year: { companyId: user.companyId, employeeId: emp.id, leaveTypeId: dto.leaveTypeId, year } },
    });
    if (!balance) throw new BadRequestException(`No leave balance allocated for ${lt.name} in ${year}`);
    if (balance.available < days) throw new BadRequestException(`Insufficient ${lt.name} balance. Available: ${balance.available} days, Requested: ${days} days`);

    // Check for overlapping leaves
    const overlap = await this.prisma.leaveApplication.findFirst({
      where: { companyId: user.companyId, employeeId: emp.id, status: { in: ['PENDING','APPROVED'] }, OR: [{ fromDate: { lte: new Date(dto.toDate) }, toDate: { gte: new Date(dto.fromDate) } }] },
    });
    if (overlap) throw new BadRequestException(`Leave already applied for overlapping dates (${overlap.applicationNumber})`);

    const appNumber = await this.generateAppNumber(user.companyId);
    const app = await this.prisma.leaveApplication.create({
      data: {
        applicationNumber: appNumber, employeeId: emp.id, leaveTypeId: dto.leaveTypeId,
        fromDate: new Date(dto.fromDate), toDate: new Date(dto.toDate),
        days, reason: dto.reason, remarks: dto.remarks,
        status: lt.requiresApproval ? 'PENDING' : 'APPROVED',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: { leaveType: { select: { name: true } }, employee: { select: { firstName: true, lastName: true } } },
    });

    // Update balance pending
    await this.prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { pending: { increment: days }, available: { decrement: days }, updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'leave_applications', recordId: app.id, action: 'CREATE', newValues: app, changedBy: user.id });
    return app;
  }

  async approveLeave(id: string, dto: ApproveLeaveDto, user: any) {
    const app = await this.prisma.leaveApplication.findFirst({
      where: { id, companyId: user.companyId },
      include: { employee: true },
    });
    if (!app) throw new NotFoundException('Leave application not found');
    if (app.status !== 'PENDING') throw new BadRequestException(`Cannot ${dto.action} — leave is already ${app.status}`);

    const year = new Date(app.fromDate).getFullYear();
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { companyId_employeeId_leaveTypeId_year: { companyId: user.companyId, employeeId: app.employeeId, leaveTypeId: app.leaveTypeId, year } },
    });

    const updated = await this.prisma.leaveApplication.update({
      where: { id },
      data: {
        status: dto.action,
        approvedBy: user.id,
        approvedAt: new Date(),
        rejectionReason: dto.rejectionReason,
        remarks: dto.remarks,
        updatedBy: user.id,
      },
      include: { leaveType: { select: { name: true } }, employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
    });

    if (balance) {
      if (dto.action === 'APPROVED') {
        await this.prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { used: { increment: app.days }, pending: { decrement: app.days }, updatedBy: user.id },
        });
      } else {
        // REJECTED — restore balance
        await this.prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { pending: { decrement: app.days }, available: { increment: app.days }, updatedBy: user.id },
        });
      }
    }

    await this.audit.log({ tableName: 'leave_applications', recordId: id, action: 'UPDATE', newValues: { ...updated, action: dto.action }, changedBy: user.id });
    return updated;
  }

  async cancelLeave(id: string, user: any) {
    const app = await this.prisma.leaveApplication.findFirst({ where: { id, companyId: user.companyId } });
    if (!app) throw new NotFoundException('Leave application not found');
    if (!['PENDING','APPROVED'].includes(app.status)) throw new BadRequestException('Cannot cancel this leave');

    const year = new Date(app.fromDate).getFullYear();
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { companyId_employeeId_leaveTypeId_year: { companyId: user.companyId, employeeId: app.employeeId, leaveTypeId: app.leaveTypeId, year } },
    });

    await this.prisma.leaveApplication.update({ where: { id }, data: { status: 'CANCELLED', updatedBy: user.id } });

    if (balance) {
      if (app.status === 'PENDING') {
        await this.prisma.leaveBalance.update({ where: { id: balance.id }, data: { pending: { decrement: app.days }, available: { increment: app.days }, updatedBy: user.id } });
      } else if (app.status === 'APPROVED') {
        await this.prisma.leaveBalance.update({ where: { id: balance.id }, data: { used: { decrement: app.days }, available: { increment: app.days }, updatedBy: user.id } });
      }
    }

    return { message: 'Leave cancelled successfully' };
  }

  async findAllApplications(user: any, query: any) {
    const { status, employeeId, month, year, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId, isActive: true };
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (month && year) {
      const from = new Date(Number(year), Number(month) - 1, 1);
      const to = new Date(Number(year), Number(month), 0);
      where.fromDate = { gte: from, lte: to };
    }

    const [data, total] = await Promise.all([
      this.prisma.leaveApplication.findMany({
        where, skip, take: Number(limit),
        include: {
          employee: { select: { firstName: true, lastName: true, employeeNumber: true, department: { select: { name: true } } } },
          leaveType: { select: { name: true, code: true, isPaid: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leaveApplication.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getStats(user: any) {
    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.leaveApplication.count({ where: { companyId: user.companyId } }),
      this.prisma.leaveApplication.count({ where: { companyId: user.companyId, status: 'PENDING' } }),
      this.prisma.leaveApplication.count({ where: { companyId: user.companyId, status: 'APPROVED' } }),
      this.prisma.leaveApplication.count({ where: { companyId: user.companyId, status: 'REJECTED' } }),
    ]);
    const leaveTypes = await this.prisma.leaveType.count({ where: { companyId: user.companyId, isActive: true } });
    return { total, pending, approved, rejected, leaveTypes };
  }
}
