import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateManpowerAllocationDto, DistributeManpowerDto, RaiseManpowerQueryDto, ResolveManpowerQueryDto, AdjustManpowerDto, TransferManpowerDto, AssignEmployeesDto, EndAssignmentDto } from './dto/manpower.dto';
import { SettingsService } from '../settings/settings.service';

const SUPERVISOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER'];
const NEXT_LEVEL: Record<string, string> = {
  HR_TO_PLANT: 'PLANT_TO_STAGE',
  PLANT_TO_STAGE: 'STAGE_TO_LINE',
};

@Injectable()
export class ManpowerService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private workflows: WorkflowsService,
    private notifications: NotificationsService,
    private settings: SettingsService,
  ) {}

  private includes() {
    return {
      fromUser: { select: { id: true, firstName: true, lastName: true, role: true } },
      toUser: { select: { id: true, firstName: true, lastName: true, role: true } },
      workOrder: { select: { id: true, woNumber: true, productName: true, stageName: true } },
      queries: { where: { isActive: true }, include: {
        raisedBy: { select: { firstName: true, lastName: true } },
        raisedTo: { select: { firstName: true, lastName: true } },
      } },
    };
  }

  // Creates the top-of-day allocation (HR -> Plant Manager). Every other
  // level is created via distribute() below, since those always happen in
  // batches (one Plant Manager splitting to several Stage/Store/Quality
  // Heads at once, not one at a time).
  async create(dto: CreateManpowerAllocationDto, user: any) {
    if (dto.level !== 'HR_TO_PLANT' && !dto.parentId) {
      throw new BadRequestException('parentId is required for this level - use the distribute endpoint instead');
    }

    let count = dto.count;
    if (dto.level !== 'HR_TO_PLANT' && (count == null || count < 1)) {
      throw new BadRequestException('count is required for this level');
    }
    if (dto.level === 'HR_TO_PLANT') {
      // Never manually typed - always computed from today's actual
      // Attendance, so the top of the chain can't silently drift from
      // what HR actually recorded.
      const day = new Date(dto.date);
      const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
      count = await this.prisma.attendance.count({
        where: { companyId: user.companyId, attendanceDate: { gte: dayStart, lte: dayEnd }, status: { in: ['PRESENT', 'HALF_DAY'] } },
      });
      if (count === 0) {
        throw new BadRequestException('No attendance marked as Present for this date yet - mark attendance first');
      }
      const existing = await this.prisma.manpowerAllocation.findFirst({
        where: { companyId: user.companyId, level: 'HR_TO_PLANT', date: { gte: dayStart, lte: dayEnd }, toUserId: dto.toUserId, isActive: true },
      });
      if (existing) {
        throw new BadRequestException(`Today's manpower has already been sent to this Plant Head (${existing.count} people) - use adjust if the count needs to change`);
      }
    }

    const allocation = await this.prisma.manpowerAllocation.create({
      data: {
        companyId: user.companyId,
        date: new Date(dto.date),
        level: dto.level,
        category: dto.category,
        fromUserId: user.id,
        toUserId: dto.toUserId,
        parentId: dto.parentId,
        count,
        remarks: dto.remarks,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'manpower_allocations', recordId: allocation.id, action: 'CREATE', newValues: allocation, changedBy: user.id });
    return allocation;
  }

  async accept(id: string, user: any) {
    const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id, companyId: user.companyId } });
    if (!allocation) throw new NotFoundException('Allocation not found');
    if (allocation.toUserId !== user.id) throw new ForbiddenException('Only the recipient can accept this allocation');
    const updated = await this.prisma.manpowerAllocation.update({
      where: { id }, data: { status: 'ACCEPTED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'manpower_allocations', recordId: id, action: 'UPDATE', newValues: { status: 'ACCEPTED' }, changedBy: user.id });
    return updated;
  }

  // Splits an accepted allocation into several next-level allocations at
  // once (e.g. Plant Manager splitting the day's headcount across SMT, MI,
  // Assembly, Packaging, Store and Quality Heads in one action). Does not
  // hard-block the total from over/under-matching the parent's count -
  // returns the difference instead, so the UI can flag it and the Plant
  // Manager can raise a query rather than being blocked outright.
  async distribute(dto: DistributeManpowerDto, user: any) {
    const parent = await this.prisma.manpowerAllocation.findFirst({ where: { id: dto.parentId, companyId: user.companyId } });
    if (!parent) throw new NotFoundException('Parent allocation not found');
    if (parent.toUserId !== user.id) throw new ForbiddenException('Only the recipient of the parent allocation can distribute it');
    if (parent.status === 'PENDING') throw new BadRequestException('Accept this allocation before distributing it');
    const nextLevel = NEXT_LEVEL[parent.level];
    if (!nextLevel) throw new BadRequestException(`${parent.level} cannot be distributed further`);
    if (!dto.lines || dto.lines.length === 0) throw new BadRequestException('Provide at least one line to distribute to');
    for (const line of dto.lines) {
      if (!line.toUserId && !line.workOrderId) {
        throw new BadRequestException('Each line needs either a recipient (line incharge) or a Work Order, or both');
      }
    }

    const created = [];
    for (const line of dto.lines) {
      const child = await this.prisma.manpowerAllocation.create({
        data: {
          companyId: user.companyId,
          date: parent.date,
          level: nextLevel,
          category: line.category,
          fromUserId: user.id,
          toUserId: line.toUserId,
          workOrderId: line.workOrderId,
          // A line with no recipient person is just the Stage Head logging
          // "N manpower on this Work Order today" - there's no one else to
          // hand it off to, so it doesn't sit PENDING waiting for an accept.
          status: line.toUserId ? 'PENDING' : 'ACCEPTED',
          parentId: parent.id,
          count: line.count,
          remarks: line.remarks,
          createdBy: user.id, updatedBy: user.id,
        },
        include: this.includes(),
      });
      created.push(child);
    }
    await this.audit.log({ tableName: 'manpower_allocations', recordId: parent.id, action: 'UPDATE', newValues: { distributed: created.map(c => ({ id: c.id, toUserId: c.toUserId, count: c.count })) }, changedBy: user.id });

    const distributedTotal = created.reduce((sum, c) => sum + c.count, 0);
    return { children: created, distributedTotal, parentCount: parent.count, difference: parent.count - distributedTotal };
  }

  async findAll(user: any, query: any) {
    const { date, level, mine } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }
    if (level) where.level = level;
    if (mine === 'true' || !SUPERVISOR_ROLES.includes(user.role)) {
      where.OR = [{ fromUserId: user.id }, { toUserId: user.id }];
    }
    return this.prisma.manpowerAllocation.findMany({
      where, include: this.includes(), orderBy: [{ date: 'desc' }, { level: 'asc' }],
    });
  }

  async findOne(id: string, user: any) {
    const allocation = await this.prisma.manpowerAllocation.findFirst({
      where: { id, companyId: user.companyId },
      include: { ...this.includes(), children: { include: this.includes() } },
    });
    if (!allocation) throw new NotFoundException('Allocation not found');
    return allocation;
  }

  // Full top-down tree from a root (HR_TO_PLANT) allocation - what gives
  // Plant Manager and above the single clean merged view of the whole
  // day's headcount, instead of jumping between separate screens per stage.
  async getChain(rootId: string, user: any) {
    const root = await this.prisma.manpowerAllocation.findFirst({ where: { id: rootId, companyId: user.companyId } });
    if (!root) throw new NotFoundException('Allocation not found');

    async function loadChildren(prisma: PrismaService, parentId: string, includes: any): Promise<any[]> {
      const children = await prisma.manpowerAllocation.findMany({ where: { parentId }, include: includes });
      for (const child of children) {
        (child as any).children = await loadChildren(prisma, child.id, includes);
      }
      return children;
    }

    const tree = await this.prisma.manpowerAllocation.findFirst({ where: { id: rootId }, include: this.includes() });
    (tree as any).children = await loadChildren(this.prisma, rootId, this.includes());
    return tree;
  }

  async raiseQuery(dto: RaiseManpowerQueryDto, user: any) {
    const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: dto.allocationId, companyId: user.companyId } });
    if (!allocation) throw new NotFoundException('Allocation not found');
    if (!allocation.toUserId) {
      throw new BadRequestException('This allocation was logged directly against a Work Order with no recipient - there is no second party to raise a query with');
    }
    let raisedToUserId: string;
    if (allocation.toUserId === user.id) raisedToUserId = allocation.fromUserId;
    else if (allocation.fromUserId === user.id) raisedToUserId = allocation.toUserId;
    else throw new ForbiddenException('Only the two parties on this allocation can raise a query about it');

    const created = await this.prisma.manpowerQuery.create({
      data: {
        companyId: user.companyId, allocationId: dto.allocationId,
        raisedByUserId: user.id, raisedToUserId, message: dto.message,
        createdBy: user.id, updatedBy: user.id,
      },
    });
    await this.prisma.manpowerAllocation.update({ where: { id: dto.allocationId }, data: { status: 'QUERIED', updatedBy: user.id } });
    await this.audit.log({ tableName: 'manpower_queries', recordId: created.id, action: 'CREATE', newValues: created, changedBy: user.id });
    return created;
  }

  async resolveQuery(id: string, dto: ResolveManpowerQueryDto, user: any) {
    const query = await this.prisma.manpowerQuery.findFirst({ where: { id, companyId: user.companyId } });
    if (!query) throw new NotFoundException('Query not found');
    if (query.raisedToUserId !== user.id) throw new ForbiddenException('Only the person the query was raised to can resolve it');
    const updated = await this.prisma.manpowerQuery.update({
      where: { id }, data: { status: 'RESOLVED', response: dto.response, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'manpower_queries', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // Increasing or decreasing manpower on an already-active Work Order's
  // allocation goes through the same Plant Head approval gate as starting
  // or restarting the Work Order itself - a Plant-Head-tier user's change
  // applies immediately, anyone else's waits for approval.
  async requestAdjust(dto: AdjustManpowerDto, user: any) {
    const allocation = await this.prisma.manpowerAllocation.findFirst({
      where: { id: dto.allocationId, companyId: user.companyId }, include: { workOrder: true },
    });
    if (!allocation) throw new NotFoundException('Allocation not found');
    if (!allocation.workOrderId) throw new BadRequestException('Only a Work Order-linked allocation can be adjusted this way');
    if (allocation.workOrder?.status !== 'IN_PROGRESS') throw new BadRequestException('This Work Order is not currently active');
    const newCount = allocation.count + dto.delta;
    if (newCount < 0) throw new BadRequestException('This would take the allocation below zero');

    if (SUPERVISOR_ROLES.includes(user.role)) {
      return this.prisma.manpowerAllocation.update({ where: { id: allocation.id }, data: { count: newCount, updatedBy: user.id } });
    }
    const documentType = dto.delta >= 0 ? 'MANPOWER_INCREASE' : 'MANPOWER_DECREASE';
    const { request } = await this.workflows.submit({
      documentType, documentId: allocation.id, documentNumber: allocation.workOrder.woNumber,
      amount: Math.abs(dto.delta), remarks: dto.reason,
    }, user);
    return { pendingApproval: true, approvalRequestId: request?.id, message: 'Submitted for Plant Head approval - manpower count has not changed yet' };
  }

  async requestTransfer(dto: TransferManpowerDto, user: any) {
    const allocation = await this.prisma.manpowerAllocation.findFirst({
      where: { id: dto.allocationId, companyId: user.companyId }, include: { workOrder: true },
    });
    if (!allocation) throw new NotFoundException('Allocation not found');
    if (!allocation.workOrderId) throw new BadRequestException('Only a Work Order-linked allocation can be transferred');
    if (dto.qty > allocation.count) throw new BadRequestException(`Cannot transfer more than the ${allocation.count} currently allocated`);
    const toWo = await this.prisma.workOrder.findFirst({ where: { id: dto.toWorkOrderId, companyId: user.companyId } });
    if (!toWo) throw new NotFoundException('Destination Work Order not found');

    if (SUPERVISOR_ROLES.includes(user.role)) {
      return this.executeTransfer(allocation, dto.toWorkOrderId, dto.qty, user);
    }
    // documentId/amount hold the source allocation and quantity; the
    // destination Work Order doesn't fit the generic engine's fixed
    // columns, so it rides along as structured remarks instead of adding
    // a bespoke field to a table shared by every other approval type.
    const { request } = await this.workflows.submit({
      documentType: 'MANPOWER_TRANSFER', documentId: allocation.id, documentNumber: allocation.workOrder.woNumber,
      amount: dto.qty, remarks: JSON.stringify({ reason: dto.reason, toWorkOrderId: dto.toWorkOrderId }),
    }, user);
    return { pendingApproval: true, approvalRequestId: request?.id, message: 'Submitted for Plant Head approval - manpower has not moved yet' };
  }

  private async executeTransfer(allocation: any, toWorkOrderId: string, qty: number, user: any) {
    await this.prisma.manpowerAllocation.update({ where: { id: allocation.id }, data: { count: allocation.count - qty, updatedBy: user.id } });
    return this.prisma.manpowerAllocation.create({
      data: {
        companyId: user.companyId, date: allocation.date, level: allocation.level, category: allocation.category,
        fromUserId: user.id, workOrderId: toWorkOrderId, count: qty, status: 'ACCEPTED',
        remarks: `Transferred from ${allocation.workOrder?.woNumber || 'another Work Order'}`,
        createdBy: user.id, updatedBy: user.id,
      },
    });
  }

  // Shared approve/reject for every gated manpower action, dispatching by
  // documentType the same way Work Order approvals do.
  async approveManpowerRequest(requestId: string, user: any) {
    const actionResult = await this.workflows.act(requestId, { action: 'APPROVED' }, user);
    if (actionResult.status === 'APPROVED') {
      if (actionResult.documentType === 'MANPOWER_INCREASE' || actionResult.documentType === 'MANPOWER_DECREASE') {
        const delta = actionResult.documentType === 'MANPOWER_INCREASE' ? actionResult.amount : -actionResult.amount;
        const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: actionResult.documentId } });
        if (allocation) await this.prisma.manpowerAllocation.update({ where: { id: allocation.id }, data: { count: allocation.count + delta, updatedBy: user.id } });
      } else if (actionResult.documentType === 'MANPOWER_TRANSFER') {
        const { toWorkOrderId } = JSON.parse(actionResult.remarks || '{}');
        const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: actionResult.documentId }, include: { workOrder: true } });
        if (allocation && toWorkOrderId) await this.executeTransfer(allocation, toWorkOrderId, actionResult.amount, user);
      }
      await this.notifyAdmins(user, actionResult, `${actionResult.documentType.replace(/_/g, ' ')} approved`);
    }
    return actionResult;
  }

  async rejectManpowerRequest(requestId: string, user: any, comments?: string) {
    return this.workflows.act(requestId, { action: 'REJECTED', comments }, user);
  }

  private async notifyAdmins(actorUser: any, request: any, message: string) {
    const admins = await this.prisma.user.findMany({ where: { companyId: actorUser.companyId, role: { in: ['ADMIN', 'SUPER_ADMIN'] } } });
    for (const admin of admins) {
      await this.notifications.create({
        userId: admin.id, type: 'PRODUCTION_APPROVAL', title: 'Production approval action',
        message: `${message}: ${request.documentNumber}`,
        referenceType: request.documentType, referenceId: request.documentId,
        referenceNumber: request.documentNumber, priority: 'MEDIUM',
      }, actorUser.companyId, actorUser.id);
    }
  }

  // ================================================================
  // PHASE 1: employee-level assignment + reconciliation
  // ================================================================

  private assignmentIncludes() {
    return {
      employee: { select: { id: true, employeeNumber: true, firstName: true, lastName: true, departmentId: true, designationId: true } },
      workOrder: { select: { id: true, woNumber: true, productName: true, stageName: true } },
      assignedBy: { select: { id: true, firstName: true, lastName: true } },
    };
  }

  // Assigning someone new automatically closes whatever assignment they
  // currently have open (if any) at the new assignment's start time -
  // this is how a mid-day move (Assembly -> Packaging) is represented:
  // never two open-ended assignments for the same person at once, so
  // overlap simply can't happen through this path.
  // PROD-003: Plant Head Allocates Manpower to Production Stage.
  // Extended in place (not duplicated) - this is the same method
  // Phase 1 already used for employee-level assignment; the checks
  // below are additive validation, not a new allocation mechanism.
  async assignEmployees(dto: AssignEmployeesDto, user: any) {
    if (!dto.employeeIds || dto.employeeIds.length === 0) {
      throw new BadRequestException('Provide at least one employee to assign');
    }
    const startTime = dto.startTime ? new Date(dto.startTime) : new Date();
    const plannedEndTime = dto.plannedEndTime ? new Date(dto.plannedEndTime) : null;
    if (plannedEndTime && plannedEndTime <= startTime) {
      throw new BadRequestException('Planned end time must be after the start time');
    }
    const dayStart = new Date(startTime); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(startTime); dayEnd.setHours(23, 59, 59, 999);

    // Stage-count authorization (spec section 4): the number assigned
    // against a given allocation can never exceed what was authorized
    // for it. Enforced here, server-side, regardless of who calls this
    // - Stage Head-tier roles already hold MANPOWER_ASSIGN, so this is
    // what actually stops "Assembly=5 becomes 6", not RBAC alone.
    let allocation: any = null;
    if (dto.allocationId) {
      allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: dto.allocationId, companyId: user.companyId } });
      if (!allocation) throw new NotFoundException('Allocation not found');
      const alreadyAssignedCount = await this.prisma.manpowerAssignment.count({
        where: { companyId: user.companyId, allocationId: dto.allocationId, endTime: null, isActive: true },
      });
      if (alreadyAssignedCount + dto.employeeIds.length > allocation.count) {
        throw new BadRequestException(`This allocation authorizes ${allocation.count} workers - ${alreadyAssignedCount} already assigned, cannot assign ${dto.employeeIds.length} more.`);
      }
    }

    const created = [];
    const skipped: { employeeId: string; reason: string }[] = [];
    const warnings: { employeeId: string; warning: string }[] = [];

    for (const employeeId of dto.employeeIds) {
      const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId: user.companyId, isActive: true } });
      if (!employee) { skipped.push({ employeeId, reason: 'Employee not found' }); continue; }

      const attendance = await this.prisma.attendance.findFirst({
        where: { companyId: user.companyId, employeeId, attendanceDate: { gte: dayStart, lte: dayEnd } },
      });
      if (!attendance || !['PRESENT', 'HALF_DAY'].includes(attendance.status)) {
        skipped.push({ employeeId, reason: `Not marked present today (${attendance?.status || 'no attendance record'})` });
        continue;
      }

      // Late-arrival control (spec section 13): allocation cannot claim
      // availability earlier than the employee's actual validated
      // check-in - never fabricate an earlier start.
      if (attendance.checkIn && startTime < attendance.checkIn) {
        skipped.push({ employeeId, reason: `Allocation start is before this employee's actual check-in (${attendance.checkIn.toISOString()})` });
        continue;
      }

      // Overlap control (spec sections 10-11): reject if this planned
      // range conflicts with any other assignment for the same
      // employee today. An assignment with no end yet (still open, or
      // no plannedEndTime given) is treated as running through the end
      // of the day for this check. Ranges that merely touch at a
      // boundary (10:00 end, 10:00 start) do not count as overlapping.
      const todaysAssignments = await this.prisma.manpowerAssignment.findMany({
        where: { companyId: user.companyId, employeeId, isActive: true, startTime: { gte: dayStart, lte: dayEnd } },
      });
      const newEnd = plannedEndTime || dayEnd;
      const conflict = todaysAssignments.find(a => {
        const existingEnd = a.endTime || a.plannedEndTime || dayEnd;
        return a.startTime < newEnd && startTime < existingEnd;
      });
      if (conflict) {
        const conflictEnd = conflict.endTime || conflict.plannedEndTime;
        skipped.push({ employeeId, reason: `Overlaps with an existing ${conflict.stageName || conflict.activityType} allocation (${conflict.startTime.toISOString()} - ${conflictEnd ? conflictEnd.toISOString() : 'ongoing'})` });
        continue;
      }

      // Skill check (spec section 15): advisory only, since no hard
      // skill-restriction config exists yet - a warning, never a block.
      if (dto.stageName && employee.skill && !employee.skill.toLowerCase().includes(dto.stageName.toLowerCase())) {
        warnings.push({ employeeId, warning: `${employee.skill} may not match the ${dto.stageName} stage` });
      }

      // Close any currently-open assignment for this person before
      // opening the new one.
      const openAssignment = await this.prisma.manpowerAssignment.findFirst({
        where: { companyId: user.companyId, employeeId, endTime: null, isActive: true },
      });
      if (openAssignment) {
        await this.prisma.manpowerAssignment.update({ where: { id: openAssignment.id }, data: { endTime: startTime, updatedBy: user.id } });
      }

      const assignment = await this.prisma.manpowerAssignment.create({
        data: {
          companyId: user.companyId,
          employeeId,
          allocationId: dto.allocationId,
          workOrderId: dto.workOrderId,
          stageName: dto.stageName,
          activityType: dto.activityType || 'PRODUCTION',
          startTime,
          plannedEndTime,
          assignedByUserId: user.id,
          remarks: dto.remarks,
          createdBy: user.id, updatedBy: user.id,
        },
        include: this.assignmentIncludes(),
      });
      created.push(assignment);
    }

    // Estimated stage labour cost - a planning reference only, never
    // posted anywhere as actual cost (spec sections 19-21).
    let estimatedCost: any = null;
    if (plannedEndTime && created.length > 0) {
      const hours = (plannedEndTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
      const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
      if (rate > 0) {
        const hourlyRate = rate / shiftHours;
        estimatedCost = {
          workerCount: created.length,
          hours: Math.round(hours * 100) / 100,
          hourlyRate,
          labourHours: Math.round(created.length * hours * 100) / 100,
          estimatedCost: Math.round(created.length * hours * hourlyRate * 100) / 100,
        };
      }
    }

    await this.audit.log({ tableName: 'manpower_assignments', recordId: dto.allocationId || dto.workOrderId || 'bulk', action: 'CREATE', newValues: { created: created.map(c => c.id), skipped, warnings }, changedBy: user.id });
    return { created, createdCount: created.length, skipped, skippedCount: skipped.length, warnings, estimatedCost };
  }

  async endAssignment(id: string, dto: EndAssignmentDto, user: any) {
    const assignment = await this.prisma.manpowerAssignment.findFirst({ where: { id, companyId: user.companyId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.endTime) throw new BadRequestException('This assignment has already ended');
    const updated = await this.prisma.manpowerAssignment.update({
      where: { id },
      data: { endTime: dto.endTime ? new Date(dto.endTime) : new Date(), updatedBy: user.id },
      include: this.assignmentIncludes(),
    });
    await this.audit.log({ tableName: 'manpower_assignments', recordId: id, action: 'UPDATE', newValues: { endTime: updated.endTime }, changedBy: user.id });
    return updated;
  }

  // Who is currently working where, right now - endTime null means
  // still active. Filterable by stage, Work Order, or the allocation
  // it traces back to, so a single roster call backs the "click
  // Assembly -> see the 45 people" and "click WO-001245 -> see the 21
  // people" drill-downs.
  async getCurrentRoster(query: any, user: any) {
    const { stageName, workOrderId, allocationId, activityType } = query;
    const where: any = { companyId: user.companyId, endTime: null, isActive: true };
    if (stageName) where.stageName = stageName;
    if (workOrderId) where.workOrderId = workOrderId;
    if (allocationId) where.allocationId = allocationId;
    if (activityType) where.activityType = activityType;
    return this.prisma.manpowerAssignment.findMany({ where, include: this.assignmentIncludes(), orderBy: { startTime: 'asc' } });
  }

  // Full day's assignment history for one employee, oldest first -
  // powers the daily timeline view (spec section 30).
  async getEmployeeTimeline(employeeId: string, date: string, user: any) {
    const day = date ? new Date(date) : new Date();
    const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);

    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId: user.companyId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const assignments = await this.prisma.manpowerAssignment.findMany({
      where: { companyId: user.companyId, employeeId, startTime: { gte: dayStart, lte: dayEnd }, isActive: true },
      include: this.assignmentIncludes(),
      orderBy: { startTime: 'asc' },
    });
    const attendance = await this.prisma.attendance.findFirst({ where: { companyId: user.companyId, employeeId, attendanceDate: { gte: dayStart, lte: dayEnd } } });

    return { employee, attendance, assignments };
  }

  private async getGracePeriodMinutes(user: any): Promise<number> {
    const setting = await this.prisma.systemSetting.findFirst({ where: { key: 'MANPOWER_GRACE_PERIOD_MINUTES' } });
    return setting ? parseInt(setting.value, 10) : 15;
  }

  // The core answer to "of everyone HR says is present, where is
  // everyone right now" (spec sections 4, 9, 50-53). An employee whose
  // last assignment ended within the grace period isn't flagged yet -
  // only someone with no active assignment AND no recently-ended one
  // counts as a real, actionable exception.
  // PROD-002: Manpower Available from HR Attendance. A pure read/
  // status view - never creates, changes, transfers or cancels any
  // allocation, and never touches WO labour cost. Composes existing
  // Attendance + Employee + ManpowerAssignment data rather than
  // duplicating any of it; deliberately separate from
  // getReconciliation()/getCurrentRoster() above (which stay
  // untouched) since this serves a different purpose - a filterable
  // availability dashboard with per-employee detail, not an
  // exception-alerting tool.
  async getManpowerAvailability(query: any, user: any) {
    const { date, shiftId, departmentId, skill, availabilityStatus } = query;
    const day = date ? new Date(date) : new Date();
    const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);

    const attendanceWhere: any = { companyId: user.companyId, attendanceDate: { gte: dayStart, lte: dayEnd } };
    if (shiftId) attendanceWhere.shiftId = shiftId;

    const allAttendance = await this.prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        employee: {
          select: {
            id: true, employeeNumber: true, firstName: true, lastName: true,
            departmentId: true, designationId: true, isProductionEligible: true, skill: true,
            department: { select: { name: true } }, designation: { select: { name: true } },
          },
        },
        shift: { select: { id: true, name: true, startTime: true, endTime: true } },
      },
    });

    const totalEmployees = await this.prisma.employee.count({ where: { companyId: user.companyId, isActive: true, status: 'ACTIVE' } });

    const presentAll = allAttendance.filter(a => ['PRESENT', 'HALF_DAY'].includes(a.status));
    const absentCount = allAttendance.filter(a => a.status === 'ABSENT').length;
    const leaveCount = allAttendance.filter(a => a.status === 'LEAVE').length;
    const weekOffCount = allAttendance.filter(a => a.status === 'WEEK_OFF').length;
    const holidayCount = allAttendance.filter(a => a.status === 'HOLIDAY').length;

    let eligiblePresent = presentAll.filter(a => a.employee.isProductionEligible);
    if (departmentId) eligiblePresent = eligiblePresent.filter(a => a.employee.departmentId === departmentId);
    if (skill) eligiblePresent = eligiblePresent.filter(a => a.employee.skill === skill);

    const employeeIds = eligiblePresent.map(a => a.employeeId);
    const activeAssignments = employeeIds.length > 0 ? await this.prisma.manpowerAssignment.findMany({
      where: { companyId: user.companyId, employeeId: { in: employeeIds }, endTime: null, isActive: true },
      include: { workOrder: { select: { id: true, woNumber: true } } },
    }) : [];
    const activeByEmployee = new Map(activeAssignments.map(a => [a.employeeId, a]));

    // Activity types that represent a legitimate, approved reason the
    // employee is temporarily off production (break, meeting, etc.) -
    // distinct from genuine production allocation. Anything not in
    // this list but still an active assignment is treated as PRODUCTION.
    const TEMP_UNAVAILABLE_ACTIVITY_TYPES = new Set([
      'TEA_BREAK', 'LUNCH_BREAK', 'APPROVED_WAITING', 'MEETING', 'TRAINING',
    ]);

    let workers = eligiblePresent.map(att => {
      const emp: any = att.employee;
      const active = activeByEmployee.get(att.employeeId);
      let allocationStatus: string;
      let availStatus: string;
      if (!active) {
        allocationStatus = 'UNALLOCATED';
        availStatus = 'AVAILABLE FOR ALLOCATION';
      } else if (TEMP_UNAVAILABLE_ACTIVITY_TYPES.has(active.activityType)) {
        allocationStatus = 'TEMPORARILY_UNAVAILABLE';
        availStatus = 'NOT AVAILABLE';
      } else {
        allocationStatus = 'ALLOCATED';
        availStatus = 'ALREADY ALLOCATED';
      }
      return {
        employeeId: emp.id, employeeNumber: emp.employeeNumber,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name, designation: emp.designation?.name, skill: emp.skill,
        shift: att.shift ? { id: att.shift.id, name: att.shift.name, startTime: att.shift.startTime, endTime: att.shift.endTime } : null,
        attendanceStatus: att.status,
        inTime: att.checkIn, outTime: att.checkOut,
        allocationStatus, availabilityStatus: availStatus,
        currentStage: active?.stageName || null,
        currentWorkOrder: active?.workOrder?.woNumber || null,
        currentActivityType: active?.activityType || null,
      };
    });

    if (availabilityStatus) workers = workers.filter(w => w.availabilityStatus === availabilityStatus);

    const productionEligiblePresent = eligiblePresent.length;
    const allocatedCount = eligiblePresent.filter(a => {
      const active = activeByEmployee.get(a.employeeId);
      return active && !TEMP_UNAVAILABLE_ACTIVITY_TYPES.has(active.activityType);
    }).length;
    const unallocatedCount = eligiblePresent.filter(a => !activeByEmployee.has(a.employeeId)).length;
    const temporarilyUnavailableCount = eligiblePresent.filter(a => {
      const active = activeByEmployee.get(a.employeeId);
      return active && TEMP_UNAVAILABLE_ACTIVITY_TYPES.has(active.activityType);
    }).length;

    // Absent/leave employees are never expected to have an active
    // production assignment - if one somehow exists, that's a real
    // data exception, not something PROD-002 silently accepts.
    const notPresentEmployeeIds = allAttendance.filter(a => ['ABSENT', 'LEAVE', 'WEEK_OFF'].includes(a.status)).map(a => a.employeeId);
    const exceptionAssignments = notPresentEmployeeIds.length > 0 ? await this.prisma.manpowerAssignment.findMany({
      where: { companyId: user.companyId, employeeId: { in: notPresentEmployeeIds }, endTime: null, isActive: true },
      include: { employee: { select: { employeeNumber: true, firstName: true, lastName: true } } },
    }) : [];

    const reconciles = productionEligiblePresent === (allocatedCount + unallocatedCount + temporarilyUnavailableCount);

    return {
      date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`,
      totalEmployees,
      totalPresent: presentAll.length,
      absent: absentCount, leave: leaveCount, weekOff: weekOffCount, holiday: holidayCount,
      productionEligiblePresent,
      allocated: allocatedCount, unallocated: unallocatedCount, temporarilyUnavailable: temporarilyUnavailableCount,
      reconciles,
      exceptions: exceptionAssignments.map(a => ({
        employeeNumber: a.employee.employeeNumber, employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
        issue: 'Has an active production assignment despite not being present today',
      })),
      workers,
    };
  }

  // The core answer to "of everyone HR says is present, where is
  // everyone right now" (spec sections 4, 9, 50-53). An employee whose
  // last assignment ended within the grace period isn't flagged yet -
  // only someone with no active assignment AND no recently-ended one
  // counts as a real, actionable exception.
  async getReconciliation(date: string, user: any) {
    const graceMinutes = await this.getGracePeriodMinutes(user);
    return this.computeReconciliation(date, user.companyId, graceMinutes);
  }

  // Company-scoped core so the scheduled exception check below can
  // reuse the exact same logic without needing a real request user.
  private async computeReconciliation(date: string, companyId: string, graceMinutes: number) {
    const day = date ? new Date(date) : new Date();
    const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
    const now = new Date();
    const graceThreshold = new Date(now.getTime() - graceMinutes * 60 * 1000);

    const presentAttendance = await this.prisma.attendance.findMany({
      where: { companyId, attendanceDate: { gte: dayStart, lte: dayEnd }, status: { in: ['PRESENT', 'HALF_DAY'] } },
      include: { employee: { select: { id: true, employeeNumber: true, firstName: true, lastName: true, departmentId: true } } },
    });

    const activeAssignments = await this.prisma.manpowerAssignment.findMany({
      where: { companyId, endTime: null, isActive: true },
      include: this.assignmentIncludes(),
    });
    const activeByEmployee = new Map(activeAssignments.map(a => [a.employeeId, a]));

    const recentlyEndedByEmployee = new Map<string, Date>();
    const recentlyEnded = await this.prisma.manpowerAssignment.findMany({
      where: { companyId, isActive: true, endTime: { gte: graceThreshold, lte: now } },
      orderBy: { endTime: 'desc' },
    });
    for (const a of recentlyEnded) {
      if (!recentlyEndedByEmployee.has(a.employeeId)) recentlyEndedByEmployee.set(a.employeeId, a.endTime as Date);
    }

    const unallocated: any[] = [];
    const allocated: any[] = [];
    const stageBreakdown = new Map<string, number>();

    for (const att of presentAttendance) {
      const active = activeByEmployee.get(att.employeeId);
      if (active) {
        allocated.push({ employee: att.employee, assignment: active });
        const key = active.stageName || active.activityType;
        stageBreakdown.set(key, (stageBreakdown.get(key) || 0) + 1);
      } else if (recentlyEndedByEmployee.has(att.employeeId)) {
        continue;
      } else {
        unallocated.push({ employee: att.employee });
      }
    }

    const hrPresent = presentAttendance.length;
    const accountedCount = allocated.length;
    const unallocatedCount = unallocated.length;
    const inGraceCount = hrPresent - accountedCount - unallocatedCount;

    return {
      date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`,
      hrPresent,
      accounted: accountedCount,
      unallocated: unallocatedCount,
      inGracePeriod: inGraceCount,
      accountedPercent: hrPresent > 0 ? Math.round((accountedCount / hrPresent) * 10000) / 100 : 100,
      stageBreakdown: Array.from(stageBreakdown.entries()).map(([key, count]) => ({ key, count })),
      unallocatedEmployees: unallocated,
      graceMinutes,
    };
  }

  // Runs every 5 minutes. For each active company, checks who's
  // currently present-but-unallocated beyond the grace period and
  // notifies Plant-tier roles - so an exception surfaces even if
  // nobody happens to have the dashboard open when it occurs. Avoids
  // repeat-notifying for the same ongoing gap by checking whether one
  // was already sent for that employee recently.
  @Cron('*/5 * * * *')
  async checkUnallocatedExceptions() {
    const companies = await this.prisma.company.findMany({ where: { isActive: true }, select: { id: true } });
    const REPEAT_SUPPRESS_MINUTES = 60;

    for (const company of companies) {
      const graceSetting = await this.prisma.systemSetting.findFirst({ where: { key: 'MANPOWER_GRACE_PERIOD_MINUTES' } });
      const graceMinutes = graceSetting ? parseInt(graceSetting.value, 10) : 15;
      const today = new Date().toISOString().slice(0, 10);
      const recon = await this.computeReconciliation(today, company.id, graceMinutes);
      if (recon.unallocatedEmployees.length === 0) continue;

      const targets = await this.prisma.user.findMany({
        where: { companyId: company.id, isActive: true, role: { in: ['PLANT_HEAD', 'PRODUCTION_HEAD', 'UNIT_HEAD', 'SUPER_ADMIN'] } },
        select: { id: true },
      });
      if (targets.length === 0) continue;
      const systemActor = targets[0].id;
      const suppressSince = new Date(Date.now() - REPEAT_SUPPRESS_MINUTES * 60 * 1000);

      for (const u of recon.unallocatedEmployees) {
        const alreadyNotified = await this.prisma.notification.findFirst({
          where: { companyId: company.id, type: 'MANPOWER_UNALLOCATED', referenceId: u.employee.id, createdAt: { gte: suppressSince } },
        });
        if (alreadyNotified) continue;

        await this.notifications.createBulk(
          targets.map(t => ({
            userId: t.id,
            type: 'MANPOWER_UNALLOCATED',
            title: 'Present but unallocated',
            message: `${u.employee.employeeNumber} — ${u.employee.firstName} ${u.employee.lastName} is marked present but has no active assignment (beyond the ${graceMinutes}-minute grace period).`,
            referenceType: 'EMPLOYEE', referenceId: u.employee.id, referenceNumber: u.employee.employeeNumber,
            priority: 'HIGH',
          })) as any,
          company.id, systemActor,
        );
      }
    }
  }
}
