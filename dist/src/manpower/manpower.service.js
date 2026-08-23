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
const workflows_service_1 = require("../workflows/workflows.service");
const notifications_service_1 = require("../notifications/notifications.service");
const SUPERVISOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER'];
const NEXT_LEVEL = {
    HR_TO_PLANT: 'PLANT_TO_STAGE',
    PLANT_TO_STAGE: 'STAGE_TO_LINE',
};
let ManpowerService = class ManpowerService {
    constructor(prisma, audit, workflows, notifications) {
        this.prisma = prisma;
        this.audit = audit;
        this.workflows = workflows;
        this.notifications = notifications;
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
        let count = dto.count;
        if (dto.level !== 'HR_TO_PLANT' && (count == null || count < 1)) {
            throw new common_1.BadRequestException('count is required for this level');
        }
        if (dto.level === 'HR_TO_PLANT') {
            const day = new Date(dto.date);
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);
            count = await this.prisma.attendance.count({
                where: { companyId: user.companyId, attendanceDate: { gte: dayStart, lte: dayEnd }, status: { in: ['PRESENT', 'HALF_DAY'] } },
            });
            if (count === 0) {
                throw new common_1.BadRequestException('No attendance marked as Present for this date yet - mark attendance first');
            }
            const existing = await this.prisma.manpowerAllocation.findFirst({
                where: { companyId: user.companyId, level: 'HR_TO_PLANT', date: { gte: dayStart, lte: dayEnd }, toUserId: dto.toUserId, isActive: true },
            });
            if (existing) {
                throw new common_1.BadRequestException(`Today's manpower has already been sent to this Plant Head (${existing.count} people) - use adjust if the count needs to change`);
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
    async requestAdjust(dto, user) {
        var _a;
        const allocation = await this.prisma.manpowerAllocation.findFirst({
            where: { id: dto.allocationId, companyId: user.companyId }, include: { workOrder: true },
        });
        if (!allocation)
            throw new common_1.NotFoundException('Allocation not found');
        if (!allocation.workOrderId)
            throw new common_1.BadRequestException('Only a Work Order-linked allocation can be adjusted this way');
        if (((_a = allocation.workOrder) === null || _a === void 0 ? void 0 : _a.status) !== 'IN_PROGRESS')
            throw new common_1.BadRequestException('This Work Order is not currently active');
        const newCount = allocation.count + dto.delta;
        if (newCount < 0)
            throw new common_1.BadRequestException('This would take the allocation below zero');
        if (SUPERVISOR_ROLES.includes(user.role)) {
            return this.prisma.manpowerAllocation.update({ where: { id: allocation.id }, data: { count: newCount, updatedBy: user.id } });
        }
        const documentType = dto.delta >= 0 ? 'MANPOWER_INCREASE' : 'MANPOWER_DECREASE';
        const { request } = await this.workflows.submit({
            documentType, documentId: allocation.id, documentNumber: allocation.workOrder.woNumber,
            amount: Math.abs(dto.delta), remarks: dto.reason,
        }, user);
        return { pendingApproval: true, approvalRequestId: request === null || request === void 0 ? void 0 : request.id, message: 'Submitted for Plant Head approval - manpower count has not changed yet' };
    }
    async requestTransfer(dto, user) {
        const allocation = await this.prisma.manpowerAllocation.findFirst({
            where: { id: dto.allocationId, companyId: user.companyId }, include: { workOrder: true },
        });
        if (!allocation)
            throw new common_1.NotFoundException('Allocation not found');
        if (!allocation.workOrderId)
            throw new common_1.BadRequestException('Only a Work Order-linked allocation can be transferred');
        if (dto.qty > allocation.count)
            throw new common_1.BadRequestException(`Cannot transfer more than the ${allocation.count} currently allocated`);
        const toWo = await this.prisma.workOrder.findFirst({ where: { id: dto.toWorkOrderId, companyId: user.companyId } });
        if (!toWo)
            throw new common_1.NotFoundException('Destination Work Order not found');
        if (SUPERVISOR_ROLES.includes(user.role)) {
            return this.executeTransfer(allocation, dto.toWorkOrderId, dto.qty, user);
        }
        const { request } = await this.workflows.submit({
            documentType: 'MANPOWER_TRANSFER', documentId: allocation.id, documentNumber: allocation.workOrder.woNumber,
            amount: dto.qty, remarks: JSON.stringify({ reason: dto.reason, toWorkOrderId: dto.toWorkOrderId }),
        }, user);
        return { pendingApproval: true, approvalRequestId: request === null || request === void 0 ? void 0 : request.id, message: 'Submitted for Plant Head approval - manpower has not moved yet' };
    }
    async executeTransfer(allocation, toWorkOrderId, qty, user) {
        var _a;
        await this.prisma.manpowerAllocation.update({ where: { id: allocation.id }, data: { count: allocation.count - qty, updatedBy: user.id } });
        return this.prisma.manpowerAllocation.create({
            data: {
                companyId: user.companyId, date: allocation.date, level: allocation.level, category: allocation.category,
                fromUserId: user.id, workOrderId: toWorkOrderId, count: qty, status: 'ACCEPTED',
                remarks: `Transferred from ${((_a = allocation.workOrder) === null || _a === void 0 ? void 0 : _a.woNumber) || 'another Work Order'}`,
                createdBy: user.id, updatedBy: user.id,
            },
        });
    }
    async approveManpowerRequest(requestId, user) {
        const actionResult = await this.workflows.act(requestId, { action: 'APPROVED' }, user);
        if (actionResult.status === 'APPROVED') {
            if (actionResult.documentType === 'MANPOWER_INCREASE' || actionResult.documentType === 'MANPOWER_DECREASE') {
                const delta = actionResult.documentType === 'MANPOWER_INCREASE' ? actionResult.amount : -actionResult.amount;
                const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: actionResult.documentId } });
                if (allocation)
                    await this.prisma.manpowerAllocation.update({ where: { id: allocation.id }, data: { count: allocation.count + delta, updatedBy: user.id } });
            }
            else if (actionResult.documentType === 'MANPOWER_TRANSFER') {
                const { toWorkOrderId } = JSON.parse(actionResult.remarks || '{}');
                const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: actionResult.documentId }, include: { workOrder: true } });
                if (allocation && toWorkOrderId)
                    await this.executeTransfer(allocation, toWorkOrderId, actionResult.amount, user);
            }
            await this.notifyAdmins(user, actionResult, `${actionResult.documentType.replace(/_/g, ' ')} approved`);
        }
        return actionResult;
    }
    async rejectManpowerRequest(requestId, user, comments) {
        return this.workflows.act(requestId, { action: 'REJECTED', comments }, user);
    }
    async notifyAdmins(actorUser, request, message) {
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
    assignmentIncludes() {
        return {
            employee: { select: { id: true, employeeNumber: true, firstName: true, lastName: true, departmentId: true, designationId: true } },
            workOrder: { select: { id: true, woNumber: true, productName: true, stageName: true } },
            assignedBy: { select: { id: true, firstName: true, lastName: true } },
        };
    }
    async assignEmployees(dto, user) {
        if (!dto.employeeIds || dto.employeeIds.length === 0) {
            throw new common_1.BadRequestException('Provide at least one employee to assign');
        }
        const startTime = dto.startTime ? new Date(dto.startTime) : new Date();
        const dayStart = new Date(startTime);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(startTime);
        dayEnd.setHours(23, 59, 59, 999);
        const created = [];
        const skipped = [];
        for (const employeeId of dto.employeeIds) {
            const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId: user.companyId, isActive: true } });
            if (!employee) {
                skipped.push({ employeeId, reason: 'Employee not found' });
                continue;
            }
            const attendance = await this.prisma.attendance.findFirst({
                where: { companyId: user.companyId, employeeId, attendanceDate: { gte: dayStart, lte: dayEnd } },
            });
            if (!attendance || !['PRESENT', 'HALF_DAY'].includes(attendance.status)) {
                skipped.push({ employeeId, reason: `Not marked present today (${(attendance === null || attendance === void 0 ? void 0 : attendance.status) || 'no attendance record'})` });
                continue;
            }
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
                    assignedByUserId: user.id,
                    remarks: dto.remarks,
                    createdBy: user.id, updatedBy: user.id,
                },
                include: this.assignmentIncludes(),
            });
            created.push(assignment);
        }
        await this.audit.log({ tableName: 'manpower_assignments', recordId: dto.allocationId || dto.workOrderId || 'bulk', action: 'CREATE', newValues: { created: created.map(c => c.id), skipped }, changedBy: user.id });
        return { created, createdCount: created.length, skipped, skippedCount: skipped.length };
    }
    async endAssignment(id, dto, user) {
        const assignment = await this.prisma.manpowerAssignment.findFirst({ where: { id, companyId: user.companyId } });
        if (!assignment)
            throw new common_1.NotFoundException('Assignment not found');
        if (assignment.endTime)
            throw new common_1.BadRequestException('This assignment has already ended');
        const updated = await this.prisma.manpowerAssignment.update({
            where: { id },
            data: { endTime: dto.endTime ? new Date(dto.endTime) : new Date(), updatedBy: user.id },
            include: this.assignmentIncludes(),
        });
        await this.audit.log({ tableName: 'manpower_assignments', recordId: id, action: 'UPDATE', newValues: { endTime: updated.endTime }, changedBy: user.id });
        return updated;
    }
    async getCurrentRoster(query, user) {
        const { stageName, workOrderId, allocationId, activityType } = query;
        const where = { companyId: user.companyId, endTime: null, isActive: true };
        if (stageName)
            where.stageName = stageName;
        if (workOrderId)
            where.workOrderId = workOrderId;
        if (allocationId)
            where.allocationId = allocationId;
        if (activityType)
            where.activityType = activityType;
        return this.prisma.manpowerAssignment.findMany({ where, include: this.assignmentIncludes(), orderBy: { startTime: 'asc' } });
    }
    async getEmployeeTimeline(employeeId, date, user) {
        const day = date ? new Date(date) : new Date();
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId: user.companyId } });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        const assignments = await this.prisma.manpowerAssignment.findMany({
            where: { companyId: user.companyId, employeeId, startTime: { gte: dayStart, lte: dayEnd }, isActive: true },
            include: this.assignmentIncludes(),
            orderBy: { startTime: 'asc' },
        });
        const attendance = await this.prisma.attendance.findFirst({ where: { companyId: user.companyId, employeeId, attendanceDate: { gte: dayStart, lte: dayEnd } } });
        return { employee, attendance, assignments };
    }
    async getGracePeriodMinutes(user) {
        const setting = await this.prisma.systemSetting.findFirst({ where: { key: 'MANPOWER_GRACE_PERIOD_MINUTES' } });
        return setting ? parseInt(setting.value, 10) : 15;
    }
    async getReconciliation(date, user) {
        const day = date ? new Date(date) : new Date();
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        const now = new Date();
        const graceMinutes = await this.getGracePeriodMinutes(user);
        const graceThreshold = new Date(now.getTime() - graceMinutes * 60 * 1000);
        const presentAttendance = await this.prisma.attendance.findMany({
            where: { companyId: user.companyId, attendanceDate: { gte: dayStart, lte: dayEnd }, status: { in: ['PRESENT', 'HALF_DAY'] } },
            include: { employee: { select: { id: true, employeeNumber: true, firstName: true, lastName: true, departmentId: true } } },
        });
        const activeAssignments = await this.prisma.manpowerAssignment.findMany({
            where: { companyId: user.companyId, endTime: null, isActive: true },
            include: this.assignmentIncludes(),
        });
        const activeByEmployee = new Map(activeAssignments.map(a => [a.employeeId, a]));
        const recentlyEndedByEmployee = new Map();
        const recentlyEnded = await this.prisma.manpowerAssignment.findMany({
            where: { companyId: user.companyId, isActive: true, endTime: { gte: graceThreshold, lte: now } },
            orderBy: { endTime: 'desc' },
        });
        for (const a of recentlyEnded) {
            if (!recentlyEndedByEmployee.has(a.employeeId))
                recentlyEndedByEmployee.set(a.employeeId, a.endTime);
        }
        const unallocated = [];
        const allocated = [];
        const stageBreakdown = new Map();
        for (const att of presentAttendance) {
            const active = activeByEmployee.get(att.employeeId);
            if (active) {
                allocated.push({ employee: att.employee, assignment: active });
                const key = active.stageName || active.activityType;
                stageBreakdown.set(key, (stageBreakdown.get(key) || 0) + 1);
            }
            else if (recentlyEndedByEmployee.has(att.employeeId)) {
                continue;
            }
            else {
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
};
exports.ManpowerService = ManpowerService;
exports.ManpowerService = ManpowerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        workflows_service_1.WorkflowsService,
        notifications_service_1.NotificationsService])
], ManpowerService);
//# sourceMappingURL=manpower.service.js.map