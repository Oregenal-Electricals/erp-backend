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
exports.WorkOrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const material_reservation_service_1 = require("./material-reservation.service");
const workflows_service_1 = require("../workflows/workflows.service");
const notifications_service_1 = require("../notifications/notifications.service");
const PRIORITY_SETTER_ROLES = ['PLANNING_MANAGER', 'PLANT_HEAD', 'UNIT_HEAD', 'CORPORATE_ADMIN', 'SUPER_ADMIN', 'ADMIN'];
const STAGE_BYPASS_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER'];
let WorkOrderService = class WorkOrderService {
    constructor(prisma, audit, materialReservation, workflows, notifications) {
        this.prisma = prisma;
        this.audit = audit;
        this.materialReservation = materialReservation;
        this.workflows = workflows;
        this.notifications = notifications;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.workOrder.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `WO-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            warehouse: { select: { name: true, code: true } },
            bom: { select: { bomNumber: true, version: true, status: true } },
        };
    }
    async create(dto, user) {
        if (dto.priority && dto.priority !== 'MEDIUM' && !PRIORITY_SETTER_ROLES.includes(user.role)) {
            throw new common_1.ForbiddenException('Only Planning Manager and above can set Work Order priority above default');
        }
        const woNumber = await this.generateNumber(user.companyId);
        const wo = await this.prisma.workOrder.create({
            data: {
                woNumber, productCode: dto.productCode, productName: dto.productName,
                uom: dto.uom || 'PCS', bomId: dto.bomId,
                warehouseId: dto.warehouseId, plannedQty: dto.plannedQty,
                plannedStartDate: new Date(dto.plannedStartDate),
                plannedEndDate: new Date(dto.plannedEndDate),
                priority: dto.priority || 'MEDIUM', remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'work_orders', recordId: wo.id, action: 'CREATE', newValues: wo, changedBy: user.id });
        return wo;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, priority } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (user.assignedStage && !STAGE_BYPASS_ROLES.includes(user.role)) {
            where.stageName = user.assignedStage;
        }
        if (search)
            where.OR = [
                { woNumber: { contains: search, mode: 'insensitive' } },
                { productCode: { contains: search, mode: 'insensitive' } },
                { productName: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        const [data, total] = await Promise.all([
            this.prisma.workOrder.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: this.includes(),
            }),
            this.prisma.workOrder.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const wo = await this.prisma.workOrder.findFirst({
            where,
            include: Object.assign(Object.assign({}, this.includes()), { bom: { include: { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } } } }),
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        return wo;
    }
    async update(id, dto, user) {
        const wo = await this.findOne(id, user);
        if (['COMPLETED', 'CANCELLED'].includes(wo.status) && dto.status !== 'CANCELLED') {
            throw new common_1.BadRequestException(`Cannot update ${wo.status} work order`);
        }
        if (dto.priority && dto.priority !== wo.priority && !PRIORITY_SETTER_ROLES.includes(user.role)) {
            throw new common_1.ForbiddenException('Only Planning Manager and above can change Work Order priority');
        }
        const updateData = Object.assign(Object.assign({}, dto), { updatedBy: user.id });
        if (dto.actualStartDate)
            updateData.actualStartDate = new Date(dto.actualStartDate);
        if (dto.actualEndDate)
            updateData.actualEndDate = new Date(dto.actualEndDate);
        if (dto.status === 'IN_PROGRESS' && !wo.actualStartDate) {
            updateData.actualStartDate = new Date();
        }
        if (dto.status === 'COMPLETED') {
            updateData.actualEndDate = new Date();
            if (dto.completedQty && dto.completedQty < wo.plannedQty) {
            }
        }
        const updated = await this.prisma.workOrder.update({
            where: { id }, data: updateData, include: this.includes(),
        });
        await this.audit.log({ tableName: 'work_orders', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async release(id, user) {
        const wo = await this.findOne(id, user);
        if (wo.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT work orders can be released');
        const updated = await this.update(id, { status: 'RELEASED' }, user);
        const reservations = await this.materialReservation.reserveForWorkOrder(id, user);
        return Object.assign(Object.assign({}, updated), { materialReservations: reservations });
    }
    async start(id, user) {
        const wo = await this.findOne(id, user);
        if (wo.status !== 'RELEASED')
            throw new common_1.BadRequestException('Only RELEASED work orders can be started');
        if (STAGE_BYPASS_ROLES.includes(user.role)) {
            return this.update(id, { status: 'IN_PROGRESS', actualStartDate: new Date().toISOString() }, user);
        }
        const { request } = await this.workflows.submit({
            documentType: 'WO_START', documentId: wo.id, documentNumber: wo.woNumber,
            remarks: `Start requested by ${user.firstName || ''} ${user.lastName || ''}`.trim(),
        }, user);
        return Object.assign(Object.assign({}, wo), { pendingApproval: true, approvalRequestId: request === null || request === void 0 ? void 0 : request.id, message: 'Submitted for Plant Head approval - this Work Order has not started yet' });
    }
    async stop(id, user) {
        const wo = await this.findOne(id, user);
        if (wo.status !== 'IN_PROGRESS')
            throw new common_1.BadRequestException('Only IN_PROGRESS work orders can be stopped');
        return this.update(id, { status: 'STOPPED' }, user);
    }
    async restart(id, user) {
        const wo = await this.findOne(id, user);
        if (wo.status !== 'STOPPED')
            throw new common_1.BadRequestException('Only STOPPED work orders can be restarted');
        if (STAGE_BYPASS_ROLES.includes(user.role)) {
            return this.update(id, { status: 'IN_PROGRESS' }, user);
        }
        const { request } = await this.workflows.submit({
            documentType: 'WO_RESTART', documentId: wo.id, documentNumber: wo.woNumber,
            remarks: `Restart requested by ${user.firstName || ''} ${user.lastName || ''}`.trim(),
        }, user);
        return Object.assign(Object.assign({}, wo), { pendingApproval: true, approvalRequestId: request === null || request === void 0 ? void 0 : request.id, message: 'Submitted for Plant Head approval - this Work Order is still stopped' });
    }
    async approveRequest(requestId, user) {
        const actionResult = await this.workflows.act(requestId, { action: 'APPROVED' }, user);
        if (actionResult.status === 'APPROVED') {
            if (actionResult.documentType === 'WO_START')
                await this.start(actionResult.documentId, user);
            else if (actionResult.documentType === 'WO_RESTART')
                await this.update(actionResult.documentId, { status: 'IN_PROGRESS' }, user);
            await this.notifyAdmins(user, actionResult, `${actionResult.documentType.replace(/_/g, ' ')} approved`);
        }
        return actionResult;
    }
    async rejectRequest(requestId, user, comments) {
        return this.workflows.act(requestId, { action: 'REJECTED', comments }, user);
    }
    async notifyAdmins(actorUser, request, message) {
        const admins = await this.prisma.user.findMany({
            where: { companyId: actorUser.companyId, role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        });
        for (const admin of admins) {
            await this.notifications.create({
                userId: admin.id, type: 'PRODUCTION_APPROVAL', title: 'Production approval action',
                message: `${message}: ${request.documentNumber}`,
                referenceType: request.documentType, referenceId: request.documentId,
                referenceNumber: request.documentNumber, priority: 'MEDIUM',
            }, actorUser.companyId, actorUser.id);
        }
    }
    async complete(id, dto, user) {
        const wo = await this.findOne(id, user);
        if (wo.status !== 'IN_PROGRESS')
            throw new common_1.BadRequestException('Only IN_PROGRESS work orders can be completed');
        const lastQc = await this.prisma.productionQc.findFirst({
            where: { companyId: user.companyId, workOrderId: id, status: 'COMPLETED' },
            orderBy: { inspectionDate: 'desc' },
        });
        if (lastQc && lastQc.result === 'FAIL') {
            throw new common_1.BadRequestException(`Cannot complete: the most recent in-process QC inspection (${lastQc.qcNumber}) failed. Record a corrective re-inspection with a PASS or CONDITIONAL result first.`);
        }
        const result = await this.update(id, {
            status: 'COMPLETED', completedQty: dto.completedQty,
            rejectedQty: dto.rejectedQty || 0, actualEndDate: new Date().toISOString(),
        }, user);
        await this.materialReservation.releaseReservations(id, user, true);
        return result;
    }
    async cancel(id, user) {
        const wo = await this.findOne(id, user);
        if (wo.status === 'COMPLETED')
            throw new common_1.BadRequestException('Cannot cancel completed work order');
        const result = await this.update(id, { status: 'CANCELLED' }, user);
        await this.materialReservation.releaseReservations(id, user, false);
        return result;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (user.assignedStage && !STAGE_BYPASS_ROLES.includes(user.role)) {
            where.stageName = user.assignedStage;
        }
        const [total, draft, released, inProgress, completed, cancelled] = await Promise.all([
            this.prisma.workOrder.count({ where }),
            this.prisma.workOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.workOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'RELEASED' }) }),
            this.prisma.workOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'IN_PROGRESS' }) }),
            this.prisma.workOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'COMPLETED' }) }),
            this.prisma.workOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
        ]);
        const totals = await this.prisma.workOrder.aggregate({
            where, _sum: { plannedQty: true, completedQty: true, rejectedQty: true },
        });
        return {
            total, draft, released, inProgress, completed, cancelled,
            totalPlanned: totals._sum.plannedQty || 0,
            totalCompleted: totals._sum.completedQty || 0,
            totalRejected: totals._sum.rejectedQty || 0,
        };
    }
};
exports.WorkOrderService = WorkOrderService;
exports.WorkOrderService = WorkOrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        material_reservation_service_1.MaterialReservationService,
        workflows_service_1.WorkflowsService,
        notifications_service_1.NotificationsService])
], WorkOrderService);
//# sourceMappingURL=work-order.service.js.map