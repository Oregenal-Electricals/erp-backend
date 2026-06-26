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
exports.ImportOrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ImportOrderService = class ImportOrderService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateIpoNumber(companyId) {
        const count = await this.prisma.importPurchaseOrder.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `IPO-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            vendor: { select: { code: true, name: true, gstin: true, email: true, phone: true } },
            pr: { select: { prNumber: true, title: true } },
            items: { where: { isActive: true }, orderBy: { sequence: 'asc' } },
        };
    }
    calcItem(unitPriceForeign, qty, exchangeRate, discount = 0, taxRate = 0, bcdRate = 0) {
        const afterDiscount = unitPriceForeign * qty * (1 - discount / 100);
        const unitPriceInr = unitPriceForeign * exchangeRate;
        const totalForeign = afterDiscount;
        const totalInrBase = afterDiscount * exchangeRate;
        const bcdAmount = totalInrBase * bcdRate / 100;
        const igstAmount = (totalInrBase + bcdAmount) * taxRate / 100;
        const taxAmount = bcdAmount + igstAmount;
        const totalInr = totalInrBase + taxAmount;
        return { unitPriceInr, totalForeign, totalInr, taxAmount, igstRate: taxRate, bcdRate };
    }
    async create(dto, user) {
        const vendor = await this.prisma.vendor.findFirst({ where: { id: dto.vendorId, companyId: user.companyId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        const ipoNumber = await this.generateIpoNumber(user.companyId);
        const { items } = dto, poData = __rest(dto, ["items"]);
        const itemsData = (items || []).map((item, idx) => {
            const calc = this.calcItem(item.unitPriceForeign, item.orderedQty, dto.exchangeRate, item.discount || 0, item.taxRate || 0, item.bcdRate || 0);
            return Object.assign(Object.assign(Object.assign({}, item), calc), { sequence: item.sequence || idx + 1, pendingQty: item.orderedQty, companyId: user.companyId, createdBy: user.id, updatedBy: user.id });
        });
        const subtotalForeign = itemsData.reduce((s, i) => s + i.totalForeign, 0);
        const subtotalInr = itemsData.reduce((s, i) => s + i.totalInr - i.taxAmount, 0);
        const totalTax = itemsData.reduce((s, i) => s + i.taxAmount, 0);
        const totalAmount = subtotalInr + totalTax;
        const ipo = await this.prisma.importPurchaseOrder.create({
            data: Object.assign(Object.assign({}, poData), { deliveryDate: new Date(dto.deliveryDate), ipoNumber, companyId: user.companyId, subtotalForeign, subtotalInr, totalTax, totalAmount, createdBy: user.id, updatedBy: user.id, items: itemsData.length > 0 ? { create: itemsData } : undefined }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'import_purchase_orders', recordId: ipo.id, action: 'CREATE', newValues: ipo, changedBy: user.id });
        return ipo;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, currency } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { ipoNumber: { contains: search, mode: 'insensitive' } },
                { vendor: { name: { contains: search, mode: 'insensitive' } } },
            ];
        if (status)
            where.status = status;
        if (currency)
            where.currency = currency;
        const [data, total] = await Promise.all([
            this.prisma.importPurchaseOrder.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { vendor: { select: { code: true, name: true } }, _count: { select: { items: true } } },
            }),
            this.prisma.importPurchaseOrder.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const ipo = await this.prisma.importPurchaseOrder.findFirst({ where, include: this.includes() });
        if (!ipo)
            throw new common_1.NotFoundException('Import PO not found');
        return ipo;
    }
    async update(id, dto, user) {
        const ipo = await this.findOne(id, user);
        if (!['DRAFT'].includes(ipo.status))
            throw new common_1.BadRequestException('Only DRAFT Import POs can be edited');
        const updated = await this.prisma.importPurchaseOrder.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'import_purchase_orders', recordId: id, action: 'UPDATE', oldValues: ipo, newValues: updated, changedBy: user.id });
        return updated;
    }
    async approve(id, user) {
        const ipo = await this.findOne(id, user);
        if (ipo.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT Import POs can be approved');
        const itemCount = await this.prisma.importPoItem.count({ where: { ipoId: id, isActive: true } });
        if (itemCount === 0)
            throw new common_1.BadRequestException('Cannot approve Import PO with no items');
        const updated = await this.prisma.importPurchaseOrder.update({
            where: { id },
            data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'import_purchase_orders', recordId: id, action: 'UPDATE', oldValues: ipo, newValues: updated, changedBy: user.id });
        return updated;
    }
    async updateStatus(id, status, user) {
        var _a;
        const ipo = await this.findOne(id, user);
        const validTransitions = {
            APPROVED: ['SENT'],
            SENT: ['PROFORMA_RECEIVED'],
            PROFORMA_RECEIVED: ['LC_OPENED'],
            LC_OPENED: ['SHIPPED'],
            SHIPPED: ['CUSTOMS_CLEARED'],
            CUSTOMS_CLEARED: ['CLOSED'],
        };
        if (!((_a = validTransitions[ipo.status]) === null || _a === void 0 ? void 0 : _a.includes(status))) {
            throw new common_1.BadRequestException(`Cannot transition from ${ipo.status} to ${status}`);
        }
        const updated = await this.prisma.importPurchaseOrder.update({
            where: { id }, data: { status, updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'import_purchase_orders', recordId: id, action: 'UPDATE', oldValues: ipo, newValues: updated, changedBy: user.id });
        return updated;
    }
    async cancel(id, user) {
        const ipo = await this.findOne(id, user);
        if (['CLOSED', 'CANCELLED'].includes(ipo.status))
            throw new common_1.BadRequestException('Cannot cancel closed or cancelled Import PO');
        const updated = await this.prisma.importPurchaseOrder.update({
            where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'import_purchase_orders', recordId: id, action: 'UPDATE', oldValues: ipo, newValues: updated, changedBy: user.id });
        return updated;
    }
    async addItem(id, dto, user) {
        var _a;
        const ipo = await this.findOne(id, user);
        if (ipo.status !== 'DRAFT')
            throw new common_1.BadRequestException('Cannot add items to non-DRAFT Import PO');
        const seq = (((_a = ipo.items) === null || _a === void 0 ? void 0 : _a.length) || 0) + 1;
        const calc = this.calcItem(dto.unitPriceForeign, dto.orderedQty, ipo.exchangeRate, dto.discount || 0, dto.taxRate || 0, dto.bcdRate || 0);
        const item = await this.prisma.importPoItem.create({
            data: Object.assign(Object.assign(Object.assign({}, dto), calc), { ipoId: id, sequence: dto.sequence || seq, pendingQty: dto.orderedQty, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.recalcTotals(id);
        return item;
    }
    async recalcTotals(ipoId) {
        const items = await this.prisma.importPoItem.findMany({ where: { ipoId, isActive: true } });
        const subtotalForeign = items.reduce((s, i) => s + i.totalForeign, 0);
        const subtotalInr = items.reduce((s, i) => s + i.totalInr - i.taxAmount, 0);
        const totalTax = items.reduce((s, i) => s + i.taxAmount, 0);
        await this.prisma.importPurchaseOrder.update({ where: { id: ipoId }, data: { subtotalForeign, subtotalInr, totalTax, totalAmount: subtotalInr + totalTax } });
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, approved, shipped, closed, cancelled] = await Promise.all([
            this.prisma.importPurchaseOrder.count({ where }),
            this.prisma.importPurchaseOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.importPurchaseOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'APPROVED' }) }),
            this.prisma.importPurchaseOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'SHIPPED' }) }),
            this.prisma.importPurchaseOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'CLOSED' }) }),
            this.prisma.importPurchaseOrder.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
        ]);
        const totalValue = await this.prisma.importPurchaseOrder.aggregate({ where, _sum: { totalAmount: true, subtotalForeign: true } });
        const byCurrency = await this.prisma.importPurchaseOrder.groupBy({ by: ['currency'], where, _count: true, _sum: { subtotalForeign: true } });
        return { total, draft, approved, shipped, closed, cancelled, totalValueInr: totalValue._sum.totalAmount || 0, totalValueForeign: totalValue._sum.subtotalForeign || 0, byCurrency };
    }
};
exports.ImportOrderService = ImportOrderService;
exports.ImportOrderService = ImportOrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ImportOrderService);
//# sourceMappingURL=import-order.service.js.map