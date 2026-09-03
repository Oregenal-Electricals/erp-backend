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
  // Architecture correction: Production manpower allocation is
  // quantity-based, not employee-wise. Splits an accepted allocation
  // into several next-level allocations by count (e.g. Plant Head
  // splitting 100 available manpower across SMT/MI/Assembly/Packaging,
  // or a Stage Head splitting their stage count across Work Orders).
  // HR continues to track employee-wise attendance separately via
  // ManpowerAssignment/assignEmployees() - that mechanism is untouched
  // and still available for HR-internal reconciliation, it is simply
  // no longer the mandatory Production allocation path.
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
      if (!line.count || line.count <= 0) {
        throw new BadRequestException('Each line needs a manpower quantity greater than zero');
      }
    }

    const requestedTotal = dto.lines.reduce((sum, l) => sum + l.count, 0);
    const existingSiblings = await this.prisma.manpowerAllocation.findMany({
      where: { companyId: user.companyId, parentId: parent.id, isActive: true, status: { not: 'REJECTED' } },
    });
    const alreadyDistributedTotal = existingSiblings.reduce((sum, s) => sum + s.count, 0);

    const rangesOverlap = (s1: Date | null, e1: Date | null, s2: Date | null, e2: Date | null) => {
      if (!s1 || !e1 || !s2 || !e2) return true;
      return s1 < e2 && s2 < e1;
    };
    for (const line of dto.lines) {
      const lineStart = line.startTime ? new Date(line.startTime) : null;
      const lineEnd = line.plannedEndTime ? new Date(line.plannedEndTime) : null;
      const concurrentSiblingTotal = existingSiblings
        .filter(s => rangesOverlap(lineStart, lineEnd, s.startTime, s.plannedEndTime))
        .reduce((sum, s) => sum + s.count, 0);
      const concurrentNewLinesTotal = dto.lines
        .filter(l => l !== line && rangesOverlap(lineStart, lineEnd, l.startTime ? new Date(l.startTime) : null, l.plannedEndTime ? new Date(l.plannedEndTime) : null))
        .reduce((sum, l) => sum + l.count, 0);
      const concurrentTotal = concurrentSiblingTotal + concurrentNewLinesTotal + line.count;
      if (concurrentTotal > parent.count) {
        throw new BadRequestException(`Concurrent manpower during this time window would reach ${concurrentTotal}, exceeding the authorized ${parent.count}.`);
      }
    }

    const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
    const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
    const labourRateSnapshot = rate > 0 ? rate / shiftHours : null;

    const created: any[] = [];
    for (const line of dto.lines) {
      const lineStart = line.startTime ? new Date(line.startTime) : null;
      const lineEnd = line.plannedEndTime ? new Date(line.plannedEndTime) : null;

      let productivityRateSnapshot: number | null = null;
      let plannedLabourHours: number | null = null;
      let plannedTargetQty: number | null = null;
      let estimatedLabourCost: number | null = null;
      if (line.workOrderId && lineStart && lineEnd) {
        const workOrder = await this.prisma.workOrder.findFirst({ where: { id: line.workOrderId, companyId: user.companyId } });
        const hours = (lineEnd.getTime() - lineStart.getTime()) / (1000 * 60 * 60);
        plannedLabourHours = Math.round(line.count * hours * 100) / 100;
        if (workOrder) {
          const product = await this.prisma.product.findFirst({ where: { code: workOrder.productCode, companyId: user.companyId } });
          if (product) {
            const now = new Date();
            const productivity = await this.prisma.productStandardProductivity.findFirst({
              where: { companyId: user.companyId, productId: product.id, isActive: true, effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] },
              orderBy: { effectiveFrom: 'desc' },
            });
            if (productivity && productivity.piecesPerManHour > 0) {
              productivityRateSnapshot = productivity.piecesPerManHour;
              plannedTargetQty = Math.round(line.count * hours * productivity.piecesPerManHour * 100) / 100;
            }
          }
        }
        if (labourRateSnapshot) {
          estimatedLabourCost = Math.round(plannedLabourHours * labourRateSnapshot * 100) / 100;
        }
      }

      const needsApproval = nextLevel === 'STAGE_TO_LINE' && !!line.workOrderId;

      const child = await this.prisma.manpowerAllocation.create({
        data: {
          companyId: user.companyId,
          date: parent.date,
          level: nextLevel,
          category: line.category,
          fromUserId: user.id,
          toUserId: line.toUserId,
          workOrderId: line.workOrderId,
          shiftId: line.shiftId,
          lineId: line.lineId,
          skillCategory: line.skillCategory,
          startTime: lineStart,
          plannedEndTime: lineEnd,
          productivityRateSnapshot,
          labourRateSnapshot: estimatedLabourCost !== null ? labourRateSnapshot : null,
          plannedLabourHours,
          plannedTargetQty,
          estimatedLabourCost,
          submittedAt: needsApproval ? new Date() : null,
          status: needsApproval ? 'PENDING_APPROVAL' : (line.toUserId ? 'PENDING' : 'ACCEPTED'),
          parentId: parent.id,
          count: line.count,
          remarks: line.remarks,
          createdBy: user.id, updatedBy: user.id,
        },
        include: this.includes(),
      });

      if (needsApproval) {
        const workOrder = await this.prisma.workOrder.findFirst({ where: { id: line.workOrderId, companyId: user.companyId } });
        await this.workflows.submit({
          documentType: 'WO_MANPOWER_ALLOCATION', documentId: child.id, documentNumber: workOrder?.woNumber || child.id,
          remarks: `${line.count} manpower proposed for ${workOrder?.woNumber || 'WO'} by ${user.firstName || ''} ${user.lastName || ''}`.trim(),
        }, user);
      }

      created.push(child);
    }
    await this.audit.log({ tableName: 'manpower_allocations', recordId: parent.id, action: 'UPDATE', newValues: { distributed: created.map(c => ({ id: c.id, toUserId: c.toUserId, count: c.count, status: c.status })) }, changedBy: user.id });
    const distributedTotal = created.reduce((sum, c) => sum + c.count, 0);
    return { children: created, distributedTotal, parentCount: parent.count, difference: parent.count - (alreadyDistributedTotal + distributedTotal) };
  }

  // PROD-005 (quantity-based correction): Plant Head reviews and
  // approves/rejects/returns a Stage Head's proposed WO manpower
  // quantity. Wraps the generic WorkflowsService the same way
  // WorkOrderService already does for WO_START - no separate approval
  // engine, no PROD-006 (production start) triggered here.
  async approveWOAllocation(allocationId: string, dto: { action: string; comments?: string }, user: any) {
    const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: allocationId, companyId: user.companyId } });
    if (!allocation) throw new NotFoundException('Allocation not found');
    if (allocation.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Allocation is ${allocation.status}, not pending approval`);
    }

    const request = await this.prisma.approvalRequest.findFirst({
      where: { companyId: user.companyId, documentType: 'WO_MANPOWER_ALLOCATION', documentId: allocationId, status: 'PENDING' },
    });
    if (!request) throw new NotFoundException('No pending approval request found for this allocation');

    const result = await this.workflows.act(request.id, { action: dto.action, comments: dto.comments } as any, user);

    let newStatus = allocation.status;
    if (result.status === 'APPROVED') newStatus = 'APPROVED';
    else if (result.status === 'REJECTED') newStatus = 'REJECTED';

    const updated = await this.prisma.manpowerAllocation.update({
      where: { id: allocationId },
      data: {
        status: newStatus,
        ...(newStatus === 'APPROVED' ? { approvedByUserId: user.id, approvedAt: new Date() } : {}),
        updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({
      tableName: 'manpower_allocations', recordId: allocationId, action: 'UPDATE',
      oldValues: { status: 'PENDING_APPROVAL' }, newValues: { status: newStatus, comments: dto.comments },
      changedBy: user.id,
    });

    return updated;
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
  // PROD-009: additional manpower must come from a genuinely available
  // unallocated pool, never created from nothing (spec section 4) - and
  // must carry a real effective time so PROD-007's costing can split
  // correctly at the moment it actually joined (spec sections 13-17).
  async requestAdjust(dto: AdjustManpowerDto, user: any) {
    const allocation = await this.prisma.manpowerAllocation.findFirst({
      where: { id: dto.allocationId, companyId: user.companyId }, include: { workOrder: true },
    });
    if (!allocation) throw new NotFoundException('Allocation not found');
    if (!allocation.workOrderId) throw new BadRequestException('Only a Work Order-linked allocation can be adjusted this way');
    if (allocation.workOrder?.status !== 'IN_PROGRESS') throw new BadRequestException('This Work Order is not currently active');
    if (dto.delta === 0) throw new BadRequestException('Delta must be non-zero');
    if (dto.delta < 0 && allocation.count + dto.delta < 0) throw new BadRequestException('This would take the allocation below zero');
    // PROD-010: a reduction must say where the manpower goes (spec
    // section 4) - the ERP must never let it simply disappear.
    if (dto.delta < 0 && !dto.destinationType) {
      throw new BadRequestException('destinationType is required for a manpower reduction - WO_TO_STAGE_UNALLOCATED, STAGE_TO_PLANT_UNALLOCATED, or TEMPORARILY_UNAVAILABLE');
    }

    if (dto.delta > 0) {
      const available = await this.getAvailableForIncrease(allocation, user);
      if (dto.delta > available) {
        throw new BadRequestException(`Requested ${dto.delta} exceeds available unallocated manpower (${available})`);
      }
    }

    const effectiveAt = dto.effectiveAt ? new Date(dto.effectiveAt) : new Date();

    if (SUPERVISOR_ROLES.includes(user.role)) {
      return this.executeAdjust(allocation, dto.delta, effectiveAt, dto.destinationType, user);
    }
    const documentType = dto.delta >= 0 ? 'MANPOWER_INCREASE' : 'MANPOWER_DECREASE';
    const { request } = await this.workflows.submit({
      documentType, documentId: allocation.id, documentNumber: allocation.workOrder.woNumber,
      amount: Math.abs(dto.delta), remarks: JSON.stringify({ reason: dto.reason, effectiveAt: effectiveAt.toISOString(), destinationType: dto.destinationType }),
    }, user);
    return { pendingApproval: true, approvalRequestId: request?.id, message: 'Submitted for Plant Head approval - manpower count has not changed yet' };
  }

  private async getAvailableForIncrease(allocation: any, user: any): Promise<number> {
    if (!allocation.parentId) return Infinity;
    const parent = await this.prisma.manpowerAllocation.findFirst({ where: { id: allocation.parentId, companyId: user.companyId } });
    if (!parent) return Infinity;
    const siblings = await this.prisma.manpowerAllocation.findMany({
      where: { companyId: user.companyId, parentId: parent.id, isActive: true, status: { not: 'REJECTED' } },
    });
    const siblingsTotal = siblings.reduce((sum: number, s: any) => sum + s.count, 0);
    return Math.max(0, parent.count - siblingsTotal);
  }

  // Walks up the ManpowerAllocation parent chain to the root HR_TO_PLANT
  // row - used only for TEMPORARILY_UNAVAILABLE (spec section 17),
  // since that quantity must shrink the eligible pool itself rather
  // than free up a reallocatable unallocated balance.
  private async findRootAllocation(allocation: any, user: any): Promise<any> {
    let current = allocation;
    while (current.parentId) {
      const parent = await this.prisma.manpowerAllocation.findFirst({ where: { id: current.parentId, companyId: user.companyId } });
      if (!parent) break;
      current = parent;
    }
    return current;
  }

  private async executeAdjust(allocation: any, delta: number, effectiveAt: Date, destinationType: string | undefined, user: any) {
    if (delta > 0) {
      return this.prisma.$transaction(async (tx) => {
        if (allocation.parentId) {
          const parent = await tx.manpowerAllocation.findFirst({ where: { id: allocation.parentId, companyId: user.companyId } });
          if (parent) {
            const siblings = await tx.manpowerAllocation.findMany({
              where: { companyId: user.companyId, parentId: parent.id, isActive: true, status: { not: 'REJECTED' } },
            });
            const siblingsTotal = siblings.reduce((sum: number, s: any) => sum + s.count, 0);
            if (delta > parent.count - siblingsTotal) {
              throw new BadRequestException('Available unallocated manpower changed since this was checked - please retry');
            }
          }
        }
        return tx.manpowerAllocation.create({
          data: {
            companyId: user.companyId, date: allocation.date, level: allocation.level, category: allocation.category,
            fromUserId: user.id, workOrderId: allocation.workOrderId, parentId: allocation.parentId,
            count: delta, status: 'ACCEPTED', startTime: effectiveAt,
            remarks: `Additional manpower for ${allocation.workOrder?.woNumber || 'this Work Order'}`,
            createdBy: user.id, updatedBy: user.id,
          },
        });
      });
    }

    // PROD-010: a reduction. WO_TO_STAGE_UNALLOCATED and
    // STAGE_TO_PLANT_UNALLOCATED both fall out of the same
    // parent/children formula already used by getAvailableForIncrease()
    // - simply reducing this row's count is enough, since the parent's
    // remaining unallocated balance automatically grows (spec sections
    // 15-16, 37). TEMPORARILY_UNAVAILABLE is the one genuinely
    // different case (spec sections 17, 21): that manpower must NOT
    // become reallocatable, so the root HR_TO_PLANT count itself
    // shrinks by the same amount, keeping every level's formula correct
    // without ever inflating an unallocated pool that isn't real.
    //
    // Concurrency-safe (spec section 39): the atomic conditional update
    // re-verifies the count at the database level in the same statement
    // as the decrement, same pattern as PROD-008's give()/transfer().
    const reduced = await this.prisma.$executeRaw`
      UPDATE manpower_allocations SET count = count + ${delta}, "updatedBy" = ${user.id}
      WHERE id = ${allocation.id} AND count >= ${-delta}
    `;
    if (reduced === 0) {
      throw new BadRequestException('Manpower count changed since this was checked - please retry');
    }

    if (destinationType === 'TEMPORARILY_UNAVAILABLE') {
      const root = await this.findRootAllocation(allocation, user);
      if (root && root.id !== allocation.id) {
        await this.prisma.manpowerAllocation.update({
          where: { id: root.id }, data: { count: { decrement: -delta }, updatedBy: user.id },
        });
      }
    }

    // Zero-manpower hold (spec sections 23-26): this WO cannot keep
    // producing as if resources exist. Production status stays
    // IN_PROGRESS (a session isn't torn down for a temporary
    // manpower gap - spec section 22) but stageStatus flags the hold
    // so ProductionEntry.create() can refuse new manpower-driven output
    // until manpower is restored, without touching quantities already
    // produced or any WIP.
    const newCount = allocation.count + delta;
    if (newCount === 0 && allocation.workOrderId) {
      await this.prisma.workOrder.update({ where: { id: allocation.workOrderId }, data: { stageStatus: 'MANPOWER_HOLD', updatedBy: user.id } });
    }

    return this.prisma.manpowerAllocation.findFirst({ where: { id: allocation.id } });
  }

  // PROD-010 (spec sections 19-21, 37): compares total currently-active
  // allocated manpower (STAGE_TO_LINE-level, the ultimate consumers)
  // against the HR-derived Production Eligible Present count. This is
  // a queryable check Plant Head can see on demand - it deliberately
  // does NOT auto-trigger from an Attendance write, since Production is
  // quantity-based and the ERP must never guess which WO loses
  // manpower when HR's count falls (spec section 19). Wiring this to
  // fire automatically from Attendance's own write path is a genuinely
  // separate integration and is out of this correction's scope.
  async getManpowerPoolReconciliation(user: any, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const allocations = await this.prisma.manpowerAllocation.findMany({
      where: { companyId: user.companyId, isActive: true, status: { not: 'REJECTED' } },
    });
    const allocatedTotal = allocations.filter((a: any) => a.level === 'STAGE_TO_LINE').reduce((sum: number, a: any) => sum + a.count, 0);
    const eligibleTotal = allocations.filter((a: any) => a.level === 'HR_TO_PLANT').reduce((sum: number, a: any) => sum + a.count, 0);
    const difference = allocatedTotal - eligibleTotal;
    return {
      date: targetDate, eligible: eligibleTotal, allocated: allocatedTotal,
      difference, overAllocated: difference > 0,
    };
  }

  // PROD-008: quantity-based manpower transfer with a real effective
  // time (spec sections 3, 9, 38) - the boundary PROD-007's costing
  // needs to split labour-hours/cost/target correctly at the moment
  // manpower actually moved, not just "sometime during this entry".
  async requestTransfer(dto: TransferManpowerDto, user: any) {
    const allocation = await this.prisma.manpowerAllocation.findFirst({
      where: { id: dto.allocationId, companyId: user.companyId }, include: { workOrder: true },
    });
    if (!allocation) throw new NotFoundException('Allocation not found');
    if (!allocation.workOrderId) throw new BadRequestException('Only a Work Order-linked allocation can be transferred');
    if (dto.qty > allocation.count) throw new BadRequestException(`Cannot transfer more than the ${allocation.count} currently allocated`);
    const toWo = await this.prisma.workOrder.findFirst({ where: { id: dto.toWorkOrderId, companyId: user.companyId } });
    if (!toWo) throw new NotFoundException('Destination Work Order not found');

    const effectiveAt = dto.effectiveAt ? new Date(dto.effectiveAt) : new Date();

    if (SUPERVISOR_ROLES.includes(user.role)) {
      return this.executeTransfer(allocation, dto.toWorkOrderId, dto.qty, effectiveAt, user);
    }
    // documentId/amount hold the source allocation and quantity; the
    // destination Work Order and effective time don't fit the generic
    // engine's fixed columns, so they ride along as structured remarks
    // instead of adding bespoke fields to a table shared by every other
    // approval type.
    const { request } = await this.workflows.submit({
      documentType: 'MANPOWER_TRANSFER', documentId: allocation.id, documentNumber: allocation.workOrder.woNumber,
      amount: dto.qty, remarks: JSON.stringify({ reason: dto.reason, toWorkOrderId: dto.toWorkOrderId, effectiveAt: effectiveAt.toISOString() }),
    }, user);
    return { pendingApproval: true, approvalRequestId: request?.id, message: 'Submitted for Plant Head approval - manpower has not moved yet' };
  }

  private async executeTransfer(allocation: any, toWorkOrderId: string, qty: number, effectiveAt: Date, user: any) {
    // Concurrency-safe (spec sections 57-58): the actual guard against
    // two simultaneous transfers together exceeding source availability
    // is this atomic conditional update, not the read-check in
    // requestTransfer() above (which is only a friendly pre-check for
    // the common case) - the WHERE clause re-verifies the count at the
    // database level in the same statement that applies the decrement.
    const updated = await this.prisma.$executeRaw`
      UPDATE manpower_allocations SET count = count - ${qty}, "updatedBy" = ${user.id}
      WHERE id = ${allocation.id} AND count >= ${qty}
    `;
    if (updated === 0) {
      throw new BadRequestException('Source manpower count changed since this was checked - please retry');
    }
    return this.prisma.manpowerAllocation.create({
      data: {
        companyId: user.companyId, date: allocation.date, level: allocation.level, category: allocation.category,
        fromUserId: user.id, workOrderId: toWorkOrderId, count: qty, status: 'ACCEPTED',
        // startTime already exists on this model (from PROD-003) as the
        // "when does this allocation become active" field - reused here
        // as the transfer's effective time, so downstream manpower
        // lookups naturally respect the boundary without a new column.
        startTime: effectiveAt,
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
        const { effectiveAt, destinationType } = JSON.parse(actionResult.remarks || '{}');
        const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: actionResult.documentId }, include: { workOrder: true } });
        if (allocation) await this.executeAdjust(allocation, delta, effectiveAt ? new Date(effectiveAt) : new Date(), destinationType, user);
      } else if (actionResult.documentType === 'MANPOWER_TRANSFER') {
        const { toWorkOrderId, effectiveAt } = JSON.parse(actionResult.remarks || '{}');
        const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: actionResult.documentId }, include: { workOrder: true } });
        if (allocation && toWorkOrderId) await this.executeTransfer(allocation, toWorkOrderId, actionResult.amount, effectiveAt ? new Date(effectiveAt) : new Date(), user);
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
  // PROD-003/PROD-004: employee-level manpower assignment. When
  // dto.workOrderId is absent this is a stage-level assignment
  // (PROD-003 behavior, unchanged). When present, this is a Stage
  // Head proposing a WO-level allocation (PROD-004) - it must be
  // drawn from the employee's existing stage-level assignment, stays
  // within its time window, targets a released WO for the right
  // stage, and lands PENDING_APPROVAL via the same generic workflow
  // engine WO_START already uses, rather than going ACTIVE immediately.
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
    const isWoLevel = !!dto.workOrderId;

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

    // PROD-004: WO eligibility (spec section 5) - only a released WO,
    // at the stage this allocation is for, can receive manpower.
    let workOrder: any = null;
    let product: any = null;
    if (isWoLevel) {
      workOrder = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
      if (!workOrder) throw new NotFoundException('Work Order not found');
      if (workOrder.status !== 'RELEASED') {
        throw new BadRequestException(`Work Order ${workOrder.woNumber} is ${workOrder.status} - only a RELEASED Work Order can receive manpower allocation`);
      }
      if (dto.stageName && workOrder.stageName && workOrder.stageName !== dto.stageName) {
        throw new BadRequestException(`Work Order ${workOrder.woNumber} belongs to stage ${workOrder.stageName}, not ${dto.stageName}`);
      }
      product = await this.prisma.product.findFirst({ where: { code: workOrder.productCode, companyId: user.companyId } });
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

      // PROD-004 stage-ownership control (spec sections 4, 31): a
      // Stage Head can only put forward workers Plant Head actually
      // gave their stage - and only within that stage allocation's own
      // time window (spec section 9). This is the real gate that
      // stops "EMP-001 from SMT" being pulled into Assembly's WO.
      let stageAssignment: any = null;
      if (isWoLevel) {
        stageAssignment = await this.prisma.manpowerAssignment.findFirst({
          where: {
            companyId: user.companyId, employeeId, isActive: true, status: 'ACTIVE',
            workOrderId: null, activityType: 'PRODUCTION',
            stageName: workOrder.stageName || dto.stageName,
            startTime: { lte: startTime },
          },
        });
        if (!stageAssignment) {
          skipped.push({ employeeId, reason: `No active ${workOrder.stageName || dto.stageName} stage allocation covering this time - not authorized for this stage` });
          continue;
        }
        const stageEnd = stageAssignment.endTime || stageAssignment.plannedEndTime || dayEnd;
        const woEnd = plannedEndTime || dayEnd;
        if (woEnd > stageEnd) {
          skipped.push({ employeeId, reason: `Requested end time is outside the authorized stage allocation window (ends ${stageEnd.toISOString()})` });
          continue;
        }
      }

      // Overlap control (spec sections 10-11): reject if this planned
      // range conflicts with another assignment for the same employee
      // today. For a WO-level allocation, only other WO-level
      // allocations count as conflicts - the parent stage-level
      // assignment is the authorizing window, not a competing one.
      const overlapWhere: any = { companyId: user.companyId, employeeId, isActive: true, startTime: { gte: dayStart, lte: dayEnd } };
      if (isWoLevel) overlapWhere.workOrderId = { not: null };
      const todaysAssignments = await this.prisma.manpowerAssignment.findMany({ where: overlapWhere });
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
      // opening the new one - only for stage-level assignment, not a
      // WO-level allocation nested inside an existing stage window.
      if (!isWoLevel) {
        const openAssignment = await this.prisma.manpowerAssignment.findFirst({
          where: { companyId: user.companyId, employeeId, endTime: null, isActive: true },
        });
        if (openAssignment) {
          await this.prisma.manpowerAssignment.update({ where: { id: openAssignment.id }, data: { endTime: startTime, updatedBy: user.id } });
        }
      }

      // PROD-004 target/cost calculation (spec sections 13-18) - rate
      // snapshots taken now so a later master change never alters this
      // planned figure retroactively.
      let plannedTargetQty: number | null = null;
      let estimatedLabourCostForEmployee: number | null = null;
      let productivityRateSnapshot: number | null = null;
      let labourRateSnapshot: number | null = null;
      if (isWoLevel && plannedEndTime && product) {
        const now = new Date();
        const productivity = await this.prisma.productStandardProductivity.findFirst({
          where: { companyId: user.companyId, productId: product.id, isActive: true, effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] },
          orderBy: { effectiveFrom: 'desc' },
        });
        const hours = (plannedEndTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        if (productivity && productivity.piecesPerManHour > 0) {
          productivityRateSnapshot = productivity.piecesPerManHour;
          plannedTargetQty = Math.round(hours * productivity.piecesPerManHour * 100) / 100;
        }
        const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
        const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
        if (rate > 0) {
          labourRateSnapshot = rate / shiftHours;
          estimatedLabourCostForEmployee = Math.round(hours * labourRateSnapshot * 100) / 100;
        }
      }

      const assignment = await this.prisma.manpowerAssignment.create({
        data: {
          companyId: user.companyId,
          employeeId,
          allocationId: dto.allocationId,
          workOrderId: dto.workOrderId,
          stageName: dto.stageName || workOrder?.stageName,
          activityType: dto.activityType || 'PRODUCTION',
          startTime,
          plannedEndTime,
          status: isWoLevel ? 'PENDING_APPROVAL' : 'ACTIVE',
          plannedTargetQty,
          estimatedLabourCost: estimatedLabourCostForEmployee,
          productivityRateSnapshot,
          labourRateSnapshot,
          submittedAt: isWoLevel ? new Date() : null,
          assignedByUserId: user.id,
          remarks: dto.remarks,
          createdBy: user.id, updatedBy: user.id,
        },
        include: this.assignmentIncludes(),
      });
      created.push(assignment);
    }

    // Estimated stage/WO labour cost - a planning reference only,
    // never posted anywhere as actual cost (spec sections 19-21).
    let estimatedCost: any = null;
    if (plannedEndTime && created.length > 0) {
      const hours = (plannedEndTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
      const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
      if (rate > 0) {
        const hourlyRate = rate / shiftHours;
        const teamTarget = created.reduce((sum, c: any) => sum + (c.plannedTargetQty || 0), 0);
        estimatedCost = {
          workerCount: created.length,
          hours: Math.round(hours * 100) / 100,
          hourlyRate,
          labourHours: Math.round(created.length * hours * 100) / 100,
          estimatedCost: Math.round(created.length * hours * hourlyRate * 100) / 100,
          plannedTargetQty: teamTarget > 0 ? Math.round(teamTarget * 100) / 100 : null,
        };
      }
    }

    // PROD-004: submit the whole batch for Plant Head approval - one
    // pending request per Work Order, matching how WO_START already
    // works (no WorkflowDefinition needs to be pre-registered; the
    // engine falls back to a single-level approval when none exists).
    let approvalRequest: any = null;
    if (isWoLevel && created.length > 0) {
      const { request } = await this.workflows.submit({
        documentType: 'WO_MANPOWER_ALLOCATION', documentId: dto.workOrderId as string, documentNumber: workOrder.woNumber,
        remarks: `${created.length} worker(s) proposed for ${workOrder.woNumber} by ${user.firstName || ''} ${user.lastName || ''}`.trim(),
      }, user);
      approvalRequest = request;
    }

    await this.audit.log({ tableName: 'manpower_assignments', recordId: dto.allocationId || dto.workOrderId || 'bulk', action: 'CREATE', newValues: { created: created.map(c => c.id), skipped, warnings }, changedBy: user.id });
    return { created, createdCount: created.length, skipped, skippedCount: skipped.length, warnings, estimatedCost, approvalRequestId: approvalRequest?.id, status: isWoLevel ? 'PENDING_APPROVAL' : 'ACTIVE' };
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
