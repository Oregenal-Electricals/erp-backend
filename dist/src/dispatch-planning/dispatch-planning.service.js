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
exports.DispatchPlanningService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const sales_orders_service_1 = require("../sales-orders/sales-orders.service");
let DispatchPlanningService = class DispatchPlanningService {
    constructor(prisma, audit, soService) {
        this.prisma = prisma;
        this.audit = audit;
        this.soService = soService;
    }
    async unplannedRemaining(tx, soItemId, pendingQty) {
        const activePlans = await tx.dispatchPlanItem.aggregate({
            where: { soItemId, isActive: true, plan: { status: { not: 'CANCELLED' } } },
            _sum: { plannedQty: true },
        });
        const activePlanned = activePlans._sum.plannedQty || 0;
        return Math.max(pendingQty - activePlanned, 0);
    }
    async generateNumber(companyId) {
        const count = await this.prisma.dispatchPlan.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `DP-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            items: true,
            salesOrder: { select: { soNumber: true, customerName: true, totalAmount: true, status: true } },
        };
    }
    async create(dto, user) {
        const so = await this.prisma.salesOrder.findFirst({
            where: { id: dto.soId, companyId: user.companyId },
            include: { items: true },
        });
        if (!so)
            throw new common_1.NotFoundException('Sales Order not found');
        if (!['CONFIRMED', 'IN_PRODUCTION'].includes(so.status))
            throw new common_1.BadRequestException('SO must be CONFIRMED or IN_PRODUCTION');
        const lineData = [];
        for (const planItem of dto.items) {
            const soItem = so.items.find(i => i.id === planItem.soItemId);
            if (!soItem)
                throw new common_1.NotFoundException(`SO item ${planItem.soItemId} not found`);
            if (!soItem.releasedForDispatch || !soItem.sourceValid) {
                throw new common_1.BadRequestException(`"${planItem.itemCode}" has not been released for Dispatch with a valid source yet.`);
            }
            if (planItem.plannedQty <= 0)
                throw new common_1.BadRequestException(`Planned qty must be greater than 0 for ${planItem.itemCode}`);
            lineData.push({ planItem, soItem });
        }
        const plan = await this.prisma.$transaction(async (tx) => {
            var _a;
            const items = [];
            for (const { planItem, soItem } of lineData) {
                const remaining = await this.unplannedRemaining(tx, soItem.id, soItem.pendingQty);
                if (planItem.plannedQty > remaining) {
                    throw new common_1.BadRequestException(`Planned qty ${planItem.plannedQty} exceeds unplanned remaining demand ${remaining} for ${planItem.itemCode} (other active plans already cover the rest).`);
                }
                const avail = await this.soService.checkAvailability(soItem.id, user);
                const lineStatus = planItem.plannedQty <= (avail.freeQty || 0) ? 'READY_FOR_RESERVATION' : 'STOCK_PENDING';
                items.push({
                    soItemId: soItem.id, itemCode: planItem.itemCode, itemName: planItem.itemName,
                    plannedQty: planItem.plannedQty, uom: planItem.uom || soItem.uom || 'PCS',
                    saleType: soItem.saleType, requiredStageId: soItem.requiredStageId,
                    sourceType: soItem.sourceType, sourcePlantId: soItem.sourcePlantId,
                    availableSnapshot: (_a = avail.freeQty) !== null && _a !== void 0 ? _a : null, snapshotCheckedAt: avail.checkedAt || new Date(),
                    lineStatus,
                    createdBy: user.id, updatedBy: user.id,
                });
            }
            const planNumber = await this.generateNumber(user.companyId);
            return tx.dispatchPlan.create({
                data: {
                    planNumber, soId: dto.soId, customerName: so.customerName,
                    deliveryAddress: dto.deliveryAddress, plannedDate: new Date(dto.plannedDate),
                    transportMode: dto.transportMode || 'ROAD',
                    transporterName: dto.transporterName, vehicleNumber: dto.vehicleNumber,
                    driverName: dto.driverName, driverPhone: dto.driverPhone, remarks: dto.remarks,
                    companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                    items: { create: items },
                },
                include: this.includes(),
            });
        });
        await this.audit.log({ tableName: 'dispatch_plans', recordId: plan.id, action: 'CREATE', newValues: plan, changedBy: user.id });
        return plan;
    }
    async approve(id, user) {
        const plan = await this.prisma.dispatchPlan.findFirst({ where: { id, companyId: user.companyId } });
        if (!plan)
            throw new common_1.NotFoundException('Dispatch plan not found');
        if (plan.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT plans can be approved');
        const updated = await this.prisma.dispatchPlan.update({
            where: { id },
            data: { status: 'APPROVED', approvedBy: user.id, approvedDate: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'dispatch_plans', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async cancel(id, dto, user) {
        const plan = await this.prisma.dispatchPlan.findFirst({ where: { id, companyId: user.companyId } });
        if (!plan)
            throw new common_1.NotFoundException('Dispatch plan not found');
        if (['DISPATCHED', 'CANCELLED'].includes(plan.status))
            throw new common_1.BadRequestException(`Cannot cancel ${plan.status} plan`);
        const updated = await this.prisma.dispatchPlan.update({
            where: { id },
            data: { status: 'CANCELLED', cancelReason: dto.cancelReason, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'dispatch_plans', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, soId } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId };
        if (search)
            where.OR = [
                { planNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { vehicleNumber: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (soId)
            where.soId = soId;
        const [data, total] = await Promise.all([
            this.prisma.dispatchPlan.findMany({
                where, skip, take: Number(limit), orderBy: { plannedDate: 'asc' },
                include: { items: { select: { id: true, itemCode: true, plannedQty: true } }, salesOrder: { select: { soNumber: true, customerName: true } } },
            }),
            this.prisma.dispatchPlan.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const plan = await this.prisma.dispatchPlan.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!plan)
            throw new common_1.NotFoundException('Dispatch plan not found');
        return plan;
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [total, draft, approved, dispatched, cancelled, overdue] = await Promise.all([
            this.prisma.dispatchPlan.count({ where }),
            this.prisma.dispatchPlan.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.dispatchPlan.count({ where: Object.assign(Object.assign({}, where), { status: 'APPROVED' }) }),
            this.prisma.dispatchPlan.count({ where: Object.assign(Object.assign({}, where), { status: 'DISPATCHED' }) }),
            this.prisma.dispatchPlan.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
            this.prisma.dispatchPlan.count({ where: Object.assign(Object.assign({}, where), { status: 'APPROVED', plannedDate: { lt: new Date() } }) }),
        ]);
        return { total, draft, approved, dispatched, cancelled, overdue };
    }
    async getPendingSoItems(soId, user) {
        const so = await this.prisma.salesOrder.findFirst({
            where: { id: soId, companyId: user.companyId },
            include: { items: true },
        });
        if (!so)
            throw new common_1.NotFoundException('Sales Order not found');
        const pendingItems = so.items.filter(i => i.pendingQty > 0);
        const items = await Promise.all(pendingItems.map(async (i) => (Object.assign(Object.assign({}, i), { unplannedRemaining: await this.unplannedRemaining(this.prisma, i.id, i.pendingQty) }))));
        return { soNumber: so.soNumber, customerName: so.customerName, items };
    }
};
exports.DispatchPlanningService = DispatchPlanningService;
exports.DispatchPlanningService = DispatchPlanningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, sales_orders_service_1.SalesOrdersService])
], DispatchPlanningService);
//# sourceMappingURL=dispatch-planning.service.js.map