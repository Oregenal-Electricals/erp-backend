"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManpowerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const SUPERVISOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER'];
const NEXT_LEVEL = {
    HR_TO_PLANT: 'PLANT_TO_STAGE',
    PLANT_TO_STAGE: 'STAGE_TO_LINE',
};
let ManpowerService = class ManpowerService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    includes() {
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
    async create(dto, user) {
        if (dto.level !== 'HR_TO_PLANT' && !dto.parentId) {
            throw new common_1.BadRequestException('parentId is required for this level - use the distribute endpoint instead');
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
    async accept(id, user) {
        const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id, companyId: user.companyId } });
        if (!allocation)
            throw new common_1.NotFoundException('Allocation not found');
        if (allocation.toUserId !== user.id)
            throw new common_1.ForbiddenException('Only the recipient can accept this allocation');
        const updated = await this.prisma.manpowerAllocation.update({
            where: { id }, data: { status: 'ACCEPTED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'manpower_allocations', recordId: id, action: 'UPDATE', newValues: { status: 'ACCEPTED' }, changedBy: user.id });
        return updated;
    }
    async distribute(dto, user) {
        const parent = await this.prisma.manpowerAllocation.findFirst({ where: { id: dto.parentId, companyId: user.companyId } });
        if (!parent)
            throw new common_1.NotFoundException('Parent allocation not found');
        if (parent.toUserId !== user.id)
            throw new common_1.ForbiddenException('Only the recipient of the parent allocation can distribute it');
        if (parent.status === 'PENDING')
            throw new common_1.BadRequestException('Accept this allocation before distributing it');
        const nextLevel = NEXT_LEVEL[parent.level];
        if (!nextLevel)
            throw new common_1.BadRequestException(`${parent.level} cannot be distributed further`);
        if (!dto.lines || dto.lines.length === 0)
            throw new common_1.BadRequestException('Provide at least one line to distribute to');
        for (const line of dto.lines) {
            if (!line.toUserId && !line.workOrderId) {
                throw new common_1.BadRequestException('Each line needs either a recipient (line incharge) or a Work Order, or both');
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
    async findAll(user, query) {
        const { date, level, mine } = query;
        const where = { companyId: user.companyId, isActive: true };
        if (date) {
            const d = new Date(date);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            where.date = { gte: d, lt: next };
        }
        if (level)
            where.level = level;
        if (mine === 'true' || !SUPERVISOR_ROLES.includes(user.role)) {
            where.OR = [{ fromUserId: user.id }, { toUserId: user.id }];
        }
        return this.prisma.manpowerAllocation.findMany({
            where, include: this.includes(), orderBy: [{ date: 'desc' }, { level: 'asc' }],
        });
    }
    async findOne(id, user) {
        const allocation = await this.prisma.manpowerAllocation.findFirst({
            where: { id, companyId: user.companyId },
            include: Object.assign(Object.assign({}, this.includes()), { children: { include: this.includes() } }),
        });
        if (!allocation)
            throw new common_1.NotFoundException('Allocation not found');
        return allocation;
    }
    async getChain(rootId, user) {
        const root = await this.prisma.manpowerAllocation.findFirst({ where: { id: rootId, companyId: user.companyId } });
        if (!root)
            throw new common_1.NotFoundException('Allocation not found');
        async function loadChildren(prisma, parentId, includes) {
            const children = await prisma.manpowerAllocation.findMany({ where: { parentId }, include: includes });
            for (const child of children) {
                child.children = await loadChildren(prisma, child.id, includes);
            }
            return children;
        }
        const tree = await this.prisma.manpowerAllocation.findFirst({ where: { id: rootId }, include: this.includes() });
        tree.children = await loadChildren(this.prisma, rootId, this.includes());
        return tree;
    }
    async raiseQuery(dto, user) {
        const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: dto.allocationId, companyId: user.companyId } });
        if (!allocation)
            throw new common_1.NotFoundException('Allocation not found');
        if (!allocation.toUserId) {
            throw new common_1.BadRequestException('This allocation was logged directly against a Work Order with no recipient - there is no second party to raise a query with');
        }
        let raisedToUserId;
        if (allocation.toUserId === user.id)
            raisedToUserId = allocation.fromUserId;
        else if (allocation.fromUserId === user.id)
            raisedToUserId = allocation.toUserId;
        else
            throw new common_1.ForbiddenException('Only the two parties on this allocation can raise a query about it');
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
    async resolveQuery(id, dto, user) {
        const query = await this.prisma.manpowerQuery.findFirst({ where: { id, companyId: user.companyId } });
        if (!query)
            throw new common_1.NotFoundException('Query not found');
        if (query.raisedToUserId !== user.id)
            throw new common_1.ForbiddenException('Only the person the query was raised to can resolve it');
        const updated = await this.prisma.manpowerQuery.update({
            where: { id }, data: { status: 'RESOLVED', response: dto.response, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'manpower_queries', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
};
exports.ManpowerService = ManpowerService;
exports.ManpowerService = ManpowerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ManpowerService);
//# sourceMappingURL=manpower.service.js.map