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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let PurchaseOrderService = class PurchaseOrderService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generatePoNumber(companyId) {
        const count = await this.prisma.purchaseOrder.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `PO-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            vendor: { select: { code: true, name: true, gstin: true, state: true, email: true, phone: true } },
            pr: { select: { prNumber: true, title: true } },
            rfq: { select: { rfqNumber: true } },
            items: { where: { isActive: true }, orderBy: { sequence: 'asc' } },
        };
    }
    calcGst(taxRate, vendorState, companyState) {
        const isInterState = vendorState && companyState && vendorState.toLowerCase() !== companyState.toLowerCase();
        return {
            igstRate: isInterState ? taxRate : 0,
            cgstRate: isInterState ? 0 : taxRate / 2,
            sgstRate: isInterState ? 0 : taxRate / 2,
        };
    }
    calcItemAmounts(unitPrice, qty, discount = 0, taxRate = 0, vendorState = '', companyState = '') {
        const afterDiscount = unitPrice * qty * (1 - discount / 100);
        const gst = this.calcGst(taxRate, vendorState, companyState);
        const taxAmount = afterDiscount * taxRate / 100;
        const totalPrice = afterDiscount + taxAmount;
        return Object.assign({ taxAmount, totalPrice }, gst);
    }
    async create(dto, user) {
        const vendor = await this.prisma.vendor.findFirst({ where: { id: dto.vendorId, companyId: user.companyId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
        const poNumber = await this.generatePoNumber(user.companyId);
        const { items } = dto, poData = __rest(dto, ["items"]);
        const itemsData = (items || []).map((item, idx) => {
            const { taxAmount, totalPrice, igstRate, cgstRate, sgstRate } = this.calcItemAmounts(item.unitPrice, item.orderedQty, item.discount || 0, item.taxRate || 0, vendor.state || '', (company === null || company === void 0 ? void 0 : company.state) || '');
            return Object.assign(Object.assign({}, item), { sequence: item.sequence || idx + 1, pendingQty: item.orderedQty, taxAmount, totalPrice, igstRate, cgstRate, sgstRate, companyId: user.companyId, createdBy: user.id, updatedBy: user.id });
        });
        const subtotal = itemsData.reduce((s, i) => s + i.unitPrice * i.orderedQty * (1 - (i.discount || 0) / 100), 0);
        const totalTax = itemsData.reduce((s, i) => s + i.taxAmount, 0);
        const totalAmount = subtotal + totalTax;
        const po = await this.prisma.purchaseOrder.create({
            data: Object.assign(Object.assign({}, poData), { deliveryDate: new Date(dto.deliveryDate), poNumber, companyId: user.companyId, subtotal, totalTax, totalAmount, createdBy: user.id, updatedBy: user.id, items: itemsData.length > 0 ? { create: itemsData } : undefined }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'purchase_orders', recordId: po.id, action: 'CREATE', newValues: po, changedBy: user.id });
        return po;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, vendorId } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { poNumber: { contains: search, mode: 'insensitive' } },
                { vendor: { name: { contains: search, mode: 'insensitive' } } },
            ];
        if (status)
            where.status = status;
        if (vendorId)
            where.vendorId = vendorId;
        const [data, total] = await Promise.all([
            this.prisma.purchaseOrder.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    vendor: { select: { code: true, name: true } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.purchaseOrder.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const po = await this.prisma.purchaseOrder.findFirst({ where, include: this.includes() });
        if (!po)
            throw new common_1.NotFoundException('Purchase Order not found');
        return po;
    }
    async findByVendor(vendorId, user) {
        const where = { vendorId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.purchaseOrder.findMany({
            where, orderBy: { createdAt: 'desc' },
            include: { vendor: { select: { code: true, name: true } }, _count: { select: { items: true } } },
        });
    }
    async update(id, dto, user) {
        const po = await this.findOne(id, user);
        if (!['DRAFT'].includes(po.status))
            throw new common_1.BadRequestException('Only DRAFT POs can be edited');
        const updated = await this.prisma.purchaseOrder.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'purchase_orders', recordId: id, action: 'UPDATE', oldValues: po, newValues: updated, changedBy: user.id });
        return updated;
    }
    async approve(id, user) {
        const po = await this.findOne(id, user);
        if (po.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT POs can be approved');
        if (!po.items || po.items.length === 0)
            throw new common_1.BadRequestException('Cannot approve PO with no items');
        const updated = await this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'purchase_orders', recordId: id, action: 'UPDATE', oldValues: po, newValues: updated, changedBy: user.id });
        return updated;
    }
    async send(id, user) {
        const po = await this.findOne(id, user);
        if (po.status !== 'APPROVED')
            throw new common_1.BadRequestException('Only APPROVED POs can be sent');
        const updated = await this.prisma.purchaseOrder.update({
            where: { id }, data: { status: 'SENT', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'purchase_orders', recordId: id, action: 'UPDATE', oldValues: po, newValues: updated, changedBy: user.id });
        return updated;
    }
    async cancel(id, user) {
        const po = await this.findOne(id, user);
        if (['CLOSED', 'CANCELLED'].includes(po.status))
            throw new common_1.BadRequestException('Cannot cancel a closed or already cancelled PO');
        const updated = await this.prisma.purchaseOrder.update({
            where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'purchase_orders', recordId: id, action: 'UPDATE', oldValues: po, newValues: updated, changedBy: user.id });
        return updated;
    }
    async addItem(id, dto, user) {
        var _a;
        const po = await this.findOne(id, user);
        if (po.status !== 'DRAFT')
            throw new common_1.BadRequestException('Cannot add items to non-DRAFT PO');
        const vendor = await this.prisma.vendor.findUnique({ where: { id: po.vendorId } });
        const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
        const seq = (((_a = po.items) === null || _a === void 0 ? void 0 : _a.length) || 0) + 1;
        const { taxAmount, totalPrice, igstRate, cgstRate, sgstRate } = this.calcItemAmounts(dto.unitPrice, dto.orderedQty, dto.discount || 0, dto.taxRate || 0, (vendor === null || vendor === void 0 ? void 0 : vendor.state) || '', (company === null || company === void 0 ? void 0 : company.state) || '');
        const item = await this.prisma.purchaseOrderItem.create({
            data: Object.assign(Object.assign({}, dto), { poId: id, sequence: dto.sequence || seq, pendingQty: dto.orderedQty, taxAmount, totalPrice, igstRate, cgstRate, sgstRate, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.recalculateTotals(id);
        return item;
    }
    async updateItem(id, itemId, dto, user) {
        var _a, _b, _c, _d, _e;
        const po = await this.findOne(id, user);
        if (po.status !== 'DRAFT')
            throw new common_1.BadRequestException('Prices are FROZEN — cannot edit items after approval');
        const item = await this.prisma.purchaseOrderItem.findFirst({ where: { id: itemId, poId: id } });
        if (!item)
            throw new common_1.NotFoundException('PO item not found');
        const vendor = await this.prisma.vendor.findUnique({ where: { id: po.vendorId } });
        const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
        const unitPrice = (_a = dto.unitPrice) !== null && _a !== void 0 ? _a : item.unitPrice;
        const orderedQty = (_b = dto.orderedQty) !== null && _b !== void 0 ? _b : item.orderedQty;
        const discount = (_d = (_c = dto.discount) !== null && _c !== void 0 ? _c : item.discount) !== null && _d !== void 0 ? _d : 0;
        const taxRate = (_e = dto.taxRate) !== null && _e !== void 0 ? _e : item.taxRate;
        const { taxAmount, totalPrice, igstRate, cgstRate, sgstRate } = this.calcItemAmounts(unitPrice, orderedQty, discount, taxRate, (vendor === null || vendor === void 0 ? void 0 : vendor.state) || '', (company === null || company === void 0 ? void 0 : company.state) || '');
        const updated = await this.prisma.purchaseOrderItem.update({
            where: { id: itemId },
            data: Object.assign(Object.assign({}, dto), { pendingQty: orderedQty - item.receivedQty, taxAmount, totalPrice, igstRate, cgstRate, sgstRate, updatedBy: user.id }),
        });
        await this.recalculateTotals(id);
        return updated;
    }
    async removeItem(id, itemId, user) {
        const po = await this.findOne(id, user);
        if (po.status !== 'DRAFT')
            throw new common_1.BadRequestException('Cannot remove items from non-DRAFT PO');
        await this.prisma.purchaseOrderItem.update({ where: { id: itemId }, data: { isActive: false, updatedBy: user.id } });
        await this.recalculateTotals(id);
        return { message: 'Item removed' };
    }
    async recalculateTotals(poId) {
        const items = await this.prisma.purchaseOrderItem.findMany({ where: { poId, isActive: true } });
        const subtotal = items.reduce((s, i) => s + i.unitPrice * i.orderedQty * (1 - (i.discount || 0) / 100), 0);
        const totalTax = items.reduce((s, i) => s + i.taxAmount, 0);
        await this.prisma.purchaseOrder.update({ where: { id: poId }, data: { subtotal, totalTax, totalAmount: subtotal + totalTax } });
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, approved, sent, partiallyReceived, closed, cancelled] = await Promise.all([
            this.prisma.purchaseOrder.count({ where }),
            this.prisma.purchaseOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.purchaseOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'APPROVED' }) }),
            this.prisma.purchaseOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'SENT' }) }),
            this.prisma.purchaseOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'PARTIALLY_RECEIVED' }) }),
            this.prisma.purchaseOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'CLOSED' }) }),
            this.prisma.purchaseOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
        ]);
        const totalValue = await this.prisma.purchaseOrder.aggregate({ where, _sum: { totalAmount: true } });
        return { total, draft, approved, sent, partiallyReceived, closed, cancelled, totalValue: totalValue._sum.totalAmount || 0 };
    }
};
exports.PurchaseOrderService = PurchaseOrderService;
exports.PurchaseOrderService = PurchaseOrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], PurchaseOrderService);
//# sourceMappingURL=purchase-order.service.js.map