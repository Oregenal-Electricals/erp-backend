import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateManpowerAllocationDto, DistributeManpowerDto, RaiseManpowerQueryDto, ResolveManpowerQueryDto } from './dto/manpower.dto';

const SUPERVISOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER'];
const NEXT_LEVEL: Record<string, string> = {
  HR_TO_PLANT: 'PLANT_TO_STAGE',
  PLANT_TO_STAGE: 'STAGE_TO_LINE',
};

@Injectable()
export class ManpowerService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

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
    const allocation = await this.prisma.manpowerAllocation.create({
      data: {
        companyId: user.companyId,
        date: new Date(dto.date),
        level: dto.level,
        category: dto.category,
        fromUserId: user.id,
        toUserId: dto.toUserId,
        parentId: dto.parentId,
        count: dto.count,
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
}
