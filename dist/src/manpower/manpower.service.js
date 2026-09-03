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
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const workflows_service_1 = require("../workflows/workflows.service");
const notifications_service_1 = require("../notifications/notifications.service");
const settings_service_1 = require("../settings/settings.service");
const SUPERVISOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER'];
const NEXT_LEVEL = {
    HR_TO_PLANT: 'PLANT_TO_STAGE',
    PLANT_TO_STAGE: 'STAGE_TO_LINE',
};
let ManpowerService = class ManpowerService {
    constructor(prisma, audit, workflows, notifications, settings) {
        this.prisma = prisma;
        this.audit = audit;
        this.workflows = workflows;
        this.notifications = notifications;
        this.settings = settings;
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
            if (!line.count || line.count <= 0) {
                throw new common_1.BadRequestException('Each line needs a manpower quantity greater than zero');
            }
        }
        const requestedTotal = dto.lines.reduce((sum, l) => sum + l.count, 0);
        const existingSiblings = await this.prisma.manpowerAllocation.findMany({
            where: { companyId: user.companyId, parentId: parent.id, isActive: true, status: { not: 'REJECTED' } },
        });
        const alreadyDistributedTotal = existingSiblings.reduce((sum, s) => sum + s.count, 0);
        const rangesOverlap = (s1, e1, s2, e2) => {
            if (!s1 || !e1 || !s2 || !e2)
                return true;
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
                throw new common_1.BadRequestException(`Concurrent manpower during this time window would reach ${concurrentTotal}, exceeding the authorized ${parent.count}.`);
            }
        }
        const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
        const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
        const labourRateSnapshot = rate > 0 ? rate / shiftHours : null;
        const created = [];
        for (const line of dto.lines) {
            const lineStart = line.startTime ? new Date(line.startTime) : null;
            const lineEnd = line.plannedEndTime ? new Date(line.plannedEndTime) : null;
            let productivityRateSnapshot = null;
            let plannedLabourHours = null;
            let plannedTargetQty = null;
            let estimatedLabourCost = null;
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
                    documentType: 'WO_MANPOWER_ALLOCATION', documentId: child.id, documentNumber: (workOrder === null || workOrder === void 0 ? void 0 : workOrder.woNumber) || child.id,
                    remarks: `${line.count} manpower proposed for ${(workOrder === null || workOrder === void 0 ? void 0 : workOrder.woNumber) || 'WO'} by ${user.firstName || ''} ${user.lastName || ''}`.trim(),
                }, user);
            }
            created.push(child);
        }
        await this.audit.log({ tableName: 'manpower_allocations', recordId: parent.id, action: 'UPDATE', newValues: { distributed: created.map(c => ({ id: c.id, toUserId: c.toUserId, count: c.count, status: c.status })) }, changedBy: user.id });
        const distributedTotal = created.reduce((sum, c) => sum + c.count, 0);
        return { children: created, distributedTotal, parentCount: parent.count, difference: parent.count - (alreadyDistributedTotal + distributedTotal) };
    }
    async approveWOAllocation(allocationId, dto, user) {
        const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: allocationId, companyId: user.companyId } });
        if (!allocation)
            throw new common_1.NotFoundException('Allocation not found');
        if (allocation.status !== 'PENDING_APPROVAL') {
            throw new common_1.BadRequestException(`Allocation is ${allocation.status}, not pending approval`);
        }
        const request = await this.prisma.approvalRequest.findFirst({
            where: { companyId: user.companyId, documentType: 'WO_MANPOWER_ALLOCATION', documentId: allocationId, status: 'PENDING' },
        });
        if (!request)
            throw new common_1.NotFoundException('No pending approval request found for this allocation');
        const result = await this.workflows.act(request.id, { action: dto.action, comments: dto.comments }, user);
        let newStatus = allocation.status;
        if (result.status === 'APPROVED')
            newStatus = 'APPROVED';
        else if (result.status === 'REJECTED')
            newStatus = 'REJECTED';
        const updated = await this.prisma.manpowerAllocation.update({
            where: { id: allocationId },
            data: Object.assign(Object.assign({ status: newStatus }, (newStatus === 'APPROVED' ? { approvedByUserId: user.id, approvedAt: new Date() } : {})), { updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'manpower_allocations', recordId: allocationId, action: 'UPDATE',
            oldValues: { status: 'PENDING_APPROVAL' }, newValues: { status: newStatus, comments: dto.comments },
            changedBy: user.id,
        });
        return updated;
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
        if (dto.delta === 0)
            throw new common_1.BadRequestException('Delta must be non-zero');
        if (dto.delta < 0 && allocation.count + dto.delta < 0)
            throw new common_1.BadRequestException('This would take the allocation below zero');
        if (dto.delta > 0) {
            const available = await this.getAvailableForIncrease(allocation, user);
            if (dto.delta > available) {
                throw new common_1.BadRequestException(`Requested ${dto.delta} exceeds available unallocated manpower (${available})`);
            }
        }
        const effectiveAt = dto.effectiveAt ? new Date(dto.effectiveAt) : new Date();
        if (SUPERVISOR_ROLES.includes(user.role)) {
            return this.executeAdjust(allocation, dto.delta, effectiveAt, user);
        }
        const documentType = dto.delta >= 0 ? 'MANPOWER_INCREASE' : 'MANPOWER_DECREASE';
        const { request } = await this.workflows.submit({
            documentType, documentId: allocation.id, documentNumber: allocation.workOrder.woNumber,
            amount: Math.abs(dto.delta), remarks: JSON.stringify({ reason: dto.reason, effectiveAt: effectiveAt.toISOString() }),
        }, user);
        return { pendingApproval: true, approvalRequestId: request === null || request === void 0 ? void 0 : request.id, message: 'Submitted for Plant Head approval - manpower count has not changed yet' };
    }
    async getAvailableForIncrease(allocation, user) {
        if (!allocation.parentId)
            return Infinity;
        const parent = await this.prisma.manpowerAllocation.findFirst({ where: { id: allocation.parentId, companyId: user.companyId } });
        if (!parent)
            return Infinity;
        const siblings = await this.prisma.manpowerAllocation.findMany({
            where: { companyId: user.companyId, parentId: parent.id, isActive: true, status: { not: 'REJECTED' } },
        });
        const siblingsTotal = siblings.reduce((sum, s) => sum + s.count, 0);
        return Math.max(0, parent.count - siblingsTotal);
    }
    async executeAdjust(allocation, delta, effectiveAt, user) {
        if (delta > 0) {
            return this.prisma.$transaction(async (tx) => {
                var _a;
                if (allocation.parentId) {
                    const parent = await tx.manpowerAllocation.findFirst({ where: { id: allocation.parentId, companyId: user.companyId } });
                    if (parent) {
                        const siblings = await tx.manpowerAllocation.findMany({
                            where: { companyId: user.companyId, parentId: parent.id, isActive: true, status: { not: 'REJECTED' } },
                        });
                        const siblingsTotal = siblings.reduce((sum, s) => sum + s.count, 0);
                        if (delta > parent.count - siblingsTotal) {
                            throw new common_1.BadRequestException('Available unallocated manpower changed since this was checked - please retry');
                        }
                    }
                }
                return tx.manpowerAllocation.create({
                    data: {
                        companyId: user.companyId, date: allocation.date, level: allocation.level, category: allocation.category,
                        fromUserId: user.id, workOrderId: allocation.workOrderId, parentId: allocation.parentId,
                        count: delta, status: 'ACCEPTED', startTime: effectiveAt,
                        remarks: `Additional manpower for ${((_a = allocation.workOrder) === null || _a === void 0 ? void 0 : _a.woNumber) || 'this Work Order'}`,
                        createdBy: user.id, updatedBy: user.id,
                    },
                });
            });
        }
        const newCount = allocation.count + delta;
        return this.prisma.manpowerAllocation.update({ where: { id: allocation.id }, data: { count: newCount, updatedBy: user.id } });
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
        const effectiveAt = dto.effectiveAt ? new Date(dto.effectiveAt) : new Date();
        if (SUPERVISOR_ROLES.includes(user.role)) {
            return this.executeTransfer(allocation, dto.toWorkOrderId, dto.qty, effectiveAt, user);
        }
        const { request } = await this.workflows.submit({
            documentType: 'MANPOWER_TRANSFER', documentId: allocation.id, documentNumber: allocation.workOrder.woNumber,
            amount: dto.qty, remarks: JSON.stringify({ reason: dto.reason, toWorkOrderId: dto.toWorkOrderId, effectiveAt: effectiveAt.toISOString() }),
        }, user);
        return { pendingApproval: true, approvalRequestId: request === null || request === void 0 ? void 0 : request.id, message: 'Submitted for Plant Head approval - manpower has not moved yet' };
    }
    async executeTransfer(allocation, toWorkOrderId, qty, effectiveAt, user) {
        var _a;
        const updated = await this.prisma.$executeRaw `
      UPDATE manpower_allocations SET count = count - ${qty}, "updatedBy" = ${user.id}
      WHERE id = ${allocation.id} AND count >= ${qty}
    `;
        if (updated === 0) {
            throw new common_1.BadRequestException('Source manpower count changed since this was checked - please retry');
        }
        return this.prisma.manpowerAllocation.create({
            data: {
                companyId: user.companyId, date: allocation.date, level: allocation.level, category: allocation.category,
                fromUserId: user.id, workOrderId: toWorkOrderId, count: qty, status: 'ACCEPTED',
                startTime: effectiveAt,
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
                const { effectiveAt } = JSON.parse(actionResult.remarks || '{}');
                const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: actionResult.documentId }, include: { workOrder: true } });
                if (allocation)
                    await this.executeAdjust(allocation, delta, effectiveAt ? new Date(effectiveAt) : new Date(), user);
            }
            else if (actionResult.documentType === 'MANPOWER_TRANSFER') {
                const { toWorkOrderId, effectiveAt } = JSON.parse(actionResult.remarks || '{}');
                const allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: actionResult.documentId }, include: { workOrder: true } });
                if (allocation && toWorkOrderId)
                    await this.executeTransfer(allocation, toWorkOrderId, actionResult.amount, effectiveAt ? new Date(effectiveAt) : new Date(), user);
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
        const plannedEndTime = dto.plannedEndTime ? new Date(dto.plannedEndTime) : null;
        if (plannedEndTime && plannedEndTime <= startTime) {
            throw new common_1.BadRequestException('Planned end time must be after the start time');
        }
        const dayStart = new Date(startTime);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(startTime);
        dayEnd.setHours(23, 59, 59, 999);
        const isWoLevel = !!dto.workOrderId;
        let allocation = null;
        if (dto.allocationId) {
            allocation = await this.prisma.manpowerAllocation.findFirst({ where: { id: dto.allocationId, companyId: user.companyId } });
            if (!allocation)
                throw new common_1.NotFoundException('Allocation not found');
            const alreadyAssignedCount = await this.prisma.manpowerAssignment.count({
                where: { companyId: user.companyId, allocationId: dto.allocationId, endTime: null, isActive: true },
            });
            if (alreadyAssignedCount + dto.employeeIds.length > allocation.count) {
                throw new common_1.BadRequestException(`This allocation authorizes ${allocation.count} workers - ${alreadyAssignedCount} already assigned, cannot assign ${dto.employeeIds.length} more.`);
            }
        }
        let workOrder = null;
        let product = null;
        if (isWoLevel) {
            workOrder = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
            if (!workOrder)
                throw new common_1.NotFoundException('Work Order not found');
            if (workOrder.status !== 'RELEASED') {
                throw new common_1.BadRequestException(`Work Order ${workOrder.woNumber} is ${workOrder.status} - only a RELEASED Work Order can receive manpower allocation`);
            }
            if (dto.stageName && workOrder.stageName && workOrder.stageName !== dto.stageName) {
                throw new common_1.BadRequestException(`Work Order ${workOrder.woNumber} belongs to stage ${workOrder.stageName}, not ${dto.stageName}`);
            }
            product = await this.prisma.product.findFirst({ where: { code: workOrder.productCode, companyId: user.companyId } });
        }
        const created = [];
        const skipped = [];
        const warnings = [];
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
            if (attendance.checkIn && startTime < attendance.checkIn) {
                skipped.push({ employeeId, reason: `Allocation start is before this employee's actual check-in (${attendance.checkIn.toISOString()})` });
                continue;
            }
            let stageAssignment = null;
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
            const overlapWhere = { companyId: user.companyId, employeeId, isActive: true, startTime: { gte: dayStart, lte: dayEnd } };
            if (isWoLevel)
                overlapWhere.workOrderId = { not: null };
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
            if (dto.stageName && employee.skill && !employee.skill.toLowerCase().includes(dto.stageName.toLowerCase())) {
                warnings.push({ employeeId, warning: `${employee.skill} may not match the ${dto.stageName} stage` });
            }
            if (!isWoLevel) {
                const openAssignment = await this.prisma.manpowerAssignment.findFirst({
                    where: { companyId: user.companyId, employeeId, endTime: null, isActive: true },
                });
                if (openAssignment) {
                    await this.prisma.manpowerAssignment.update({ where: { id: openAssignment.id }, data: { endTime: startTime, updatedBy: user.id } });
                }
            }
            let plannedTargetQty = null;
            let estimatedLabourCostForEmployee = null;
            let productivityRateSnapshot = null;
            let labourRateSnapshot = null;
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
                    stageName: dto.stageName || (workOrder === null || workOrder === void 0 ? void 0 : workOrder.stageName),
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
        let estimatedCost = null;
        if (plannedEndTime && created.length > 0) {
            const hours = (plannedEndTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
            const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
            if (rate > 0) {
                const hourlyRate = rate / shiftHours;
                const teamTarget = created.reduce((sum, c) => sum + (c.plannedTargetQty || 0), 0);
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
        let approvalRequest = null;
        if (isWoLevel && created.length > 0) {
            const { request } = await this.workflows.submit({
                documentType: 'WO_MANPOWER_ALLOCATION', documentId: dto.workOrderId, documentNumber: workOrder.woNumber,
                remarks: `${created.length} worker(s) proposed for ${workOrder.woNumber} by ${user.firstName || ''} ${user.lastName || ''}`.trim(),
            }, user);
            approvalRequest = request;
        }
        await this.audit.log({ tableName: 'manpower_assignments', recordId: dto.allocationId || dto.workOrderId || 'bulk', action: 'CREATE', newValues: { created: created.map(c => c.id), skipped, warnings }, changedBy: user.id });
        return { created, createdCount: created.length, skipped, skippedCount: skipped.length, warnings, estimatedCost, approvalRequestId: approvalRequest === null || approvalRequest === void 0 ? void 0 : approvalRequest.id, status: isWoLevel ? 'PENDING_APPROVAL' : 'ACTIVE' };
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
    async getManpowerAvailability(query, user) {
        const { date, shiftId, departmentId, skill, availabilityStatus } = query;
        const day = date ? new Date(date) : new Date();
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        const attendanceWhere = { companyId: user.companyId, attendanceDate: { gte: dayStart, lte: dayEnd } };
        if (shiftId)
            attendanceWhere.shiftId = shiftId;
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
        if (departmentId)
            eligiblePresent = eligiblePresent.filter(a => a.employee.departmentId === departmentId);
        if (skill)
            eligiblePresent = eligiblePresent.filter(a => a.employee.skill === skill);
        const employeeIds = eligiblePresent.map(a => a.employeeId);
        const activeAssignments = employeeIds.length > 0 ? await this.prisma.manpowerAssignment.findMany({
            where: { companyId: user.companyId, employeeId: { in: employeeIds }, endTime: null, isActive: true },
            include: { workOrder: { select: { id: true, woNumber: true } } },
        }) : [];
        const activeByEmployee = new Map(activeAssignments.map(a => [a.employeeId, a]));
        const TEMP_UNAVAILABLE_ACTIVITY_TYPES = new Set([
            'TEA_BREAK', 'LUNCH_BREAK', 'APPROVED_WAITING', 'MEETING', 'TRAINING',
        ]);
        let workers = eligiblePresent.map(att => {
            var _a, _b, _c;
            const emp = att.employee;
            const active = activeByEmployee.get(att.employeeId);
            let allocationStatus;
            let availStatus;
            if (!active) {
                allocationStatus = 'UNALLOCATED';
                availStatus = 'AVAILABLE FOR ALLOCATION';
            }
            else if (TEMP_UNAVAILABLE_ACTIVITY_TYPES.has(active.activityType)) {
                allocationStatus = 'TEMPORARILY_UNAVAILABLE';
                availStatus = 'NOT AVAILABLE';
            }
            else {
                allocationStatus = 'ALLOCATED';
                availStatus = 'ALREADY ALLOCATED';
            }
            return {
                employeeId: emp.id, employeeNumber: emp.employeeNumber,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                department: (_a = emp.department) === null || _a === void 0 ? void 0 : _a.name, designation: (_b = emp.designation) === null || _b === void 0 ? void 0 : _b.name, skill: emp.skill,
                shift: att.shift ? { id: att.shift.id, name: att.shift.name, startTime: att.shift.startTime, endTime: att.shift.endTime } : null,
                attendanceStatus: att.status,
                inTime: att.checkIn, outTime: att.checkOut,
                allocationStatus, availabilityStatus: availStatus,
                currentStage: (active === null || active === void 0 ? void 0 : active.stageName) || null,
                currentWorkOrder: ((_c = active === null || active === void 0 ? void 0 : active.workOrder) === null || _c === void 0 ? void 0 : _c.woNumber) || null,
                currentActivityType: (active === null || active === void 0 ? void 0 : active.activityType) || null,
            };
        });
        if (availabilityStatus)
            workers = workers.filter(w => w.availabilityStatus === availabilityStatus);
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
    async getReconciliation(date, user) {
        const graceMinutes = await this.getGracePeriodMinutes(user);
        return this.computeReconciliation(date, user.companyId, graceMinutes);
    }
    async computeReconciliation(date, companyId, graceMinutes) {
        const day = date ? new Date(date) : new Date();
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
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
        const recentlyEndedByEmployee = new Map();
        const recentlyEnded = await this.prisma.manpowerAssignment.findMany({
            where: { companyId, isActive: true, endTime: { gte: graceThreshold, lte: now } },
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
    async checkUnallocatedExceptions() {
        const companies = await this.prisma.company.findMany({ where: { isActive: true }, select: { id: true } });
        const REPEAT_SUPPRESS_MINUTES = 60;
        for (const company of companies) {
            const graceSetting = await this.prisma.systemSetting.findFirst({ where: { key: 'MANPOWER_GRACE_PERIOD_MINUTES' } });
            const graceMinutes = graceSetting ? parseInt(graceSetting.value, 10) : 15;
            const today = new Date().toISOString().slice(0, 10);
            const recon = await this.computeReconciliation(today, company.id, graceMinutes);
            if (recon.unallocatedEmployees.length === 0)
                continue;
            const targets = await this.prisma.user.findMany({
                where: { companyId: company.id, isActive: true, role: { in: ['PLANT_HEAD', 'PRODUCTION_HEAD', 'UNIT_HEAD', 'SUPER_ADMIN'] } },
                select: { id: true },
            });
            if (targets.length === 0)
                continue;
            const systemActor = targets[0].id;
            const suppressSince = new Date(Date.now() - REPEAT_SUPPRESS_MINUTES * 60 * 1000);
            for (const u of recon.unallocatedEmployees) {
                const alreadyNotified = await this.prisma.notification.findFirst({
                    where: { companyId: company.id, type: 'MANPOWER_UNALLOCATED', referenceId: u.employee.id, createdAt: { gte: suppressSince } },
                });
                if (alreadyNotified)
                    continue;
                await this.notifications.createBulk(targets.map(t => ({
                    userId: t.id,
                    type: 'MANPOWER_UNALLOCATED',
                    title: 'Present but unallocated',
                    message: `${u.employee.employeeNumber} — ${u.employee.firstName} ${u.employee.lastName} is marked present but has no active assignment (beyond the ${graceMinutes}-minute grace period).`,
                    referenceType: 'EMPLOYEE', referenceId: u.employee.id, referenceNumber: u.employee.employeeNumber,
                    priority: 'HIGH',
                })), company.id, systemActor);
            }
        }
    }
};
exports.ManpowerService = ManpowerService;
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ManpowerService.prototype, "checkUnallocatedExceptions", null);
exports.ManpowerService = ManpowerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        workflows_service_1.WorkflowsService,
        notifications_service_1.NotificationsService,
        settings_service_1.SettingsService])
], ManpowerService);
//# sourceMappingURL=manpower.service.js.map