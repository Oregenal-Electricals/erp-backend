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
const PRIORITY_SETTER_ROLES = ['PLANNING_MANAGER', 'PLANT_HEAD', 'UNIT_HEAD', 'CORPORATE_ADMIN', 'SUPER_ADMIN', 'ADMIN'];
let WorkOrderService = class WorkOrderService {
    constructor(prisma, audit, materialReservation) {
        this.prisma = prisma;
        this.audit = audit;
        this.materialReservation = materialReservation;
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
        return this.update(id, { status: 'IN_PROGRESS', actualStartDate: new Date().toISOString() }, user);
    }
    async complete(id, dto, user) {
        const wo = await this.findOne(id, user);
        if (wo.status !== 'IN_PROGRESS')
            throw new common_1.BadRequestException('Only IN_PROGRESS work orders can be completed');
        return this.update(id, {
            status: 'COMPLETED', completedQty: dto.completedQty,
            rejectedQty: dto.rejectedQty || 0, actualEndDate: new Date().toISOString(),
        }, user);
    }
    async cancel(id, user) {
        const wo = await this.findOne(id, user);
        if (wo.status === 'COMPLETED')
            throw new common_1.BadRequestException('Cannot cancel completed work order');
        return this.update(id, { status: 'CANCELLED' }, user);
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
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
        material_reservation_service_1.MaterialReservationService])
], WorkOrderService);
//# sourceMappingURL=work-order.service.js.map