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
exports.SalesOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const test_session_context_1 = require("../common/context/test-session.context");
let SalesOrdersService = class SalesOrdersService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId, client = this.prisma) {
        const count = await client.salesOrder.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `SO-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async createFromCpo(cpo, cpoItems, user, tx = this.prisma) {
        const soNumber = await this.generateNumber(user.companyId, tx);
        const calcItems = cpoItems.map((item) => {
            var _a;
            return (Object.assign(Object.assign({ cpoItemId: item.id, itemCode: item.itemCode, itemName: item.itemName, description: item.description, qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice, discount: item.discount || 0, gstRate: (_a = item.gstRate) !== null && _a !== void 0 ? _a : 18 }, this.calcItem(item)), { createdBy: user.id, updatedBy: user.id, isTestData: (0, test_session_context_1.isTestSessionActive)() }));
        });
        const subtotal = calcItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
        const totalGst = calcItems.reduce((s, i) => s + i.gstAmount, 0);
        const totalAmount = calcItems.reduce((s, i) => s + i.totalAmount, 0);
        const so = await tx.salesOrder.create({
            data: {
                soNumber,
                cpoId: cpo.id,
                customerName: cpo.customerName,
                deliveryDate: cpo.deliveryDate,
                currency: cpo.currency,
                remarks: `Auto-created on acknowledgment of ${cpo.cpoNumber}`,
                subtotal: Math.round(subtotal * 100) / 100,
                totalGst: Math.round(totalGst * 100) / 100,
                totalAmount: Math.round(totalAmount * 100) / 100,
                companyId: user.companyId,
                createdBy: user.id,
                updatedBy: user.id,
                status: 'CONFIRMED',
                confirmedDate: new Date(),
                confirmedBy: user.id,
                items: { create: calcItems },
            },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'sales_orders',
            recordId: so.id,
            action: 'CREATE',
            newValues: so,
            changedBy: user.id,
        });
        return so;
    }
    calcItem(item) {
        var _a;
        const qty = item.qty || 0;
        const unitPrice = item.unitPrice || 0;
        const discount = item.discount || 0;
        const gstRate = (_a = item.gstRate) !== null && _a !== void 0 ? _a : 18;
        const gross = qty * unitPrice;
        const discAmt = Math.round(((gross * discount) / 100) * 100) / 100;
        const taxableAmt = Math.round((gross - discAmt) * 100) / 100;
        const gstAmount = Math.round(((taxableAmt * gstRate) / 100) * 100) / 100;
        const totalAmount = Math.round((taxableAmt + gstAmount) * 100) / 100;
        return { taxableAmt, gstAmount, totalAmount, pendingQty: qty };
    }
    async validateSaleTypeItem(item, user) {
        const saleType = item.saleType || 'FG';
        if (!['RM', 'SFG', 'FG'].includes(saleType)) {
            throw new common_1.BadRequestException(`Invalid saleType "${saleType}" for ${item.itemCode} - must be RM, SFG, or FG.`);
        }
        if (saleType === 'RM') {
            const rm = await this.prisma.rawMaterial.findFirst({ where: { companyId: user.companyId, code: item.itemCode, isActive: true } });
            if (!rm)
                throw new common_1.BadRequestException(`"${item.itemCode}" is marked as an RM sale but no active Raw Material with that code exists.`);
            return { saleType, requiredStageId: null };
        }
        const product = await this.prisma.product.findFirst({ where: { companyId: user.companyId, code: item.itemCode, isActive: true } });
        if (!product)
            throw new common_1.BadRequestException(`"${item.itemCode}" is marked as a ${saleType} sale but no active Product with that code exists.`);
        if (saleType === 'FG') {
            return { saleType, requiredStageId: null };
        }
        if (!item.requiredStageId) {
            throw new common_1.BadRequestException(`"${item.itemCode}" is marked as an SFG sale but no required Production Stage was selected.`);
        }
        const stage = await this.prisma.routingStage.findFirst({
            where: { id: item.requiredStageId, companyId: user.companyId, routing: { finalProductId: product.id } },
            include: { routing: { select: { routingName: true } } },
        });
        if (!stage) {
            throw new common_1.BadRequestException(`Selected stage is not a valid Production Stage for "${item.itemCode}".`);
        }
        if (!stage.isSaleable) {
            throw new common_1.BadRequestException(`${stage.stageName} stage is not configured as saleable for this product.`);
        }
        return { saleType, requiredStageId: stage.id };
    }
    includes() {
        return {
            items: true,
            cpo: {
                select: {
                    cpoNumber: true,
                    customerPoNumber: true,
                    deliveryDate: true,
                    status: true,
                },
            },
        };
    }
    async create(dto, user) {
        var _a;
        const cpo = await this.prisma.customerPo.findFirst({
            where: { id: dto.cpoId, companyId: user.companyId },
        });
        if (!cpo)
            throw new common_1.NotFoundException('Customer PO not found');
        if (!['ACKNOWLEDGED', 'IN_PROGRESS'].includes(cpo.status))
            throw new common_1.BadRequestException('CPO must be ACKNOWLEDGED or IN_PROGRESS');
        const existingSo = await this.prisma.salesOrder.findFirst({
            where: { cpoId: dto.cpoId, isActive: true },
        });
        if (existingSo)
            throw new common_1.BadRequestException(`This CPO already has Sales Order ${existingSo.soNumber}. A CPO can only have one Sales Order - split shipments in Work Orders / Dispatch Planning instead.`);
        const soNumber = await this.generateNumber(user.companyId);
        const calcItems = [];
        for (const item of dto.items) {
            const { saleType, requiredStageId } = await this.validateSaleTypeItem(item, user);
            calcItems.push(Object.assign(Object.assign({ cpoItemId: item.cpoItemId, itemCode: item.itemCode, itemName: item.itemName, description: item.description, qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice, discount: item.discount || 0, gstRate: (_a = item.gstRate) !== null && _a !== void 0 ? _a : 18, saleType,
                requiredStageId }, this.calcItem(item)), { createdBy: user.id, updatedBy: user.id }));
        }
        const subtotal = calcItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
        const totalGst = calcItems.reduce((s, i) => s + i.gstAmount, 0);
        const totalAmount = calcItems.reduce((s, i) => s + i.totalAmount, 0);
        const so = await this.prisma.salesOrder.create({
            data: {
                soNumber,
                cpoId: dto.cpoId,
                customerName: cpo.customerName,
                deliveryDate: new Date(dto.deliveryDate),
                currency: cpo.currency,
                remarks: dto.remarks,
                subtotal: Math.round(subtotal * 100) / 100,
                totalGst: Math.round(totalGst * 100) / 100,
                totalAmount: Math.round(totalAmount * 100) / 100,
                companyId: user.companyId,
                createdBy: user.id,
                updatedBy: user.id,
                items: { create: calcItems },
            },
            include: this.includes(),
        });
        await this.prisma.customerPo.update({
            where: { id: dto.cpoId },
            data: { status: 'IN_PROGRESS', updatedBy: user.id },
        });
        await this.audit.log({
            tableName: 'sales_orders',
            recordId: so.id,
            action: 'CREATE',
            newValues: so,
            changedBy: user.id,
        });
        return so;
    }
    async confirm(id, user) {
        const so = await this.prisma.salesOrder.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!so)
            throw new common_1.NotFoundException('Sales Order not found');
        if (so.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT sales orders can be confirmed');
        const updated = await this.prisma.salesOrder.update({
            where: { id },
            data: {
                status: 'CONFIRMED',
                confirmedDate: new Date(),
                confirmedBy: user.id,
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'sales_orders',
            recordId: id,
            action: 'UPDATE',
            newValues: updated,
            changedBy: user.id,
        });
        return updated;
    }
    async cancel(id, dto, user) {
        const so = await this.prisma.salesOrder.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!so)
            throw new common_1.NotFoundException('Sales Order not found');
        if (['COMPLETED', 'CANCELLED'].includes(so.status))
            throw new common_1.BadRequestException(`Cannot cancel ${so.status} SO`);
        if (so.status === 'DISPATCHED')
            throw new common_1.BadRequestException('Cannot cancel partially dispatched SO');
        const updated = await this.prisma.salesOrder.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                cancelledDate: new Date(),
                cancelReason: dto.cancelReason,
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'sales_orders',
            recordId: id,
            action: 'UPDATE',
            newValues: updated,
            changedBy: user.id,
        });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId };
        if (search)
            where.OR = [
                { soNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status.includes(',') ? { in: status.split(',') } : status;
        const [data, total] = await Promise.all([
            this.prisma.salesOrder.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        select: {
                            id: true,
                            itemCode: true,
                            qty: true,
                            dispatchedQty: true,
                            pendingQty: true,
                        },
                    },
                    cpo: { select: { cpoNumber: true, customerPoNumber: true } },
                },
            }),
            this.prisma.salesOrder.count({ where }),
        ]);
        return {
            data,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        };
    }
    async findOne(id, user) {
        const so = await this.prisma.salesOrder.findFirst({
            where: { id, companyId: user.companyId },
            include: this.includes(),
        });
        if (!so)
            throw new common_1.NotFoundException('Sales Order not found');
        return so;
    }
    async getByCpo(cpoId, user) {
        return this.prisma.salesOrder.findMany({
            where: { cpoId, companyId: user.companyId },
            include: this.includes(),
            orderBy: { createdAt: 'desc' },
        });
    }
    async releaseLineForDispatch(soItemId, user) {
        const item = await this.prisma.salesOrderItem.findFirst({
            where: { id: soItemId, isActive: true, salesOrder: { companyId: user.companyId } },
            include: { salesOrder: true, requiredStage: true },
        });
        if (!item)
            throw new common_1.NotFoundException('Sales Order line not found');
        if (!['CONFIRMED', 'IN_PRODUCTION'].includes(item.salesOrder.status)) {
            throw new common_1.BadRequestException(`Sales Order must be CONFIRMED or IN_PRODUCTION to release a line for Dispatch (currently ${item.salesOrder.status})`);
        }
        if (item.releasedForDispatch) {
            throw new common_1.BadRequestException('This line is already released for Dispatch');
        }
        if (item.saleType === 'SFG') {
            if (!item.requiredStage) {
                throw new common_1.BadRequestException(`"${item.itemCode}" is marked as an SFG sale but has no required Production Stage on record.`);
            }
            if (!item.requiredStage.isSaleable) {
                throw new common_1.BadRequestException(`${item.requiredStage.stageName} stage is not configured as saleable for this product.`);
            }
        }
        const updated = await this.prisma.salesOrderItem.update({
            where: { id: soItemId },
            data: { releasedForDispatch: true, releasedAt: new Date(), releasedBy: user.id, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'sales_order_items', recordId: soItemId, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async getDispatchReadyLines(user, query) {
        const { saleType } = query || {};
        const where = {
            releasedForDispatch: true,
            isActive: true,
            pendingQty: { gt: 0 },
            salesOrder: { companyId: user.companyId, status: { notIn: ['CANCELLED'] } },
        };
        if (saleType)
            where.saleType = saleType;
        const items = await this.prisma.salesOrderItem.findMany({
            where,
            include: {
                salesOrder: { select: { soNumber: true, customerName: true, deliveryDate: true, status: true, cpo: { select: { customerPoNumber: true } } } },
                requiredStage: { select: { stageName: true } },
            },
            orderBy: { salesOrder: { deliveryDate: 'asc' } },
        });
        return items.map(i => {
            var _a, _b;
            return ({
                soItemId: i.id,
                soNumber: i.salesOrder.soNumber,
                customerName: i.salesOrder.customerName,
                customerPoNumber: (_a = i.salesOrder.cpo) === null || _a === void 0 ? void 0 : _a.customerPoNumber,
                itemCode: i.itemCode,
                itemName: i.itemName,
                saleType: i.saleType,
                requiredStageName: ((_b = i.requiredStage) === null || _b === void 0 ? void 0 : _b.stageName) || null,
                orderedQty: i.qty,
                dispatchedQty: i.dispatchedQty,
                pendingQty: i.pendingQty,
                uom: i.uom,
                deliveryDate: i.salesOrder.deliveryDate,
                salesOrderStatus: i.salesOrder.status,
            });
        });
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [total, draft, confirmed, inProduction, dispatched, completed, cancelled, overdue,] = await Promise.all([
            this.prisma.salesOrder.count({ where }),
            this.prisma.salesOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.salesOrder.count({
                where: Object.assign(Object.assign({}, where), { status: 'CONFIRMED' }),
            }),
            this.prisma.salesOrder.count({
                where: Object.assign(Object.assign({}, where), { status: 'IN_PRODUCTION' }),
            }),
            this.prisma.salesOrder.count({
                where: Object.assign(Object.assign({}, where), { status: 'DISPATCHED' }),
            }),
            this.prisma.salesOrder.count({
                where: Object.assign(Object.assign({}, where), { status: 'COMPLETED' }),
            }),
            this.prisma.salesOrder.count({
                where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }),
            }),
            this.prisma.salesOrder.count({
                where: Object.assign(Object.assign({}, where), { status: { in: ['CONFIRMED', 'IN_PRODUCTION'] }, deliveryDate: { lt: new Date() } }),
            }),
        ]);
        const valueAgg = await this.prisma.salesOrder.aggregate({
            where: Object.assign(Object.assign({}, where), { status: { notIn: ['CANCELLED'] } }),
            _sum: { totalAmount: true },
        });
        return {
            total,
            draft,
            confirmed,
            inProduction,
            dispatched,
            completed,
            cancelled,
            overdue,
            totalValue: valueAgg._sum.totalAmount || 0,
        };
    }
};
exports.SalesOrdersService = SalesOrdersService;
exports.SalesOrdersService = SalesOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SalesOrdersService);
//# sourceMappingURL=sales-orders.service.js.map