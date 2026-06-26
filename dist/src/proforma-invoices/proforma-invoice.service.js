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
exports.ProformaInvoiceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ProformaInvoiceService = class ProformaInvoiceService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generatePiNumber(companyId) {
        const count = await this.prisma.proformaInvoice.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `PI-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            ipo: { select: { ipoNumber: true, currency: true, exchangeRate: true, status: true, vendor: { select: { code: true, name: true } } } },
            items: { where: { isActive: true }, orderBy: { sequence: 'asc' } },
        };
    }
    async create(dto, user) {
        const ipo = await this.prisma.importPurchaseOrder.findFirst({
            where: { id: dto.ipoId, companyId: user.companyId },
        });
        if (!ipo)
            throw new common_1.NotFoundException('Import PO not found');
        if (!['SENT', 'PROFORMA_RECEIVED'].includes(ipo.status)) {
            throw new common_1.BadRequestException('Import PO must be SENT before receiving Proforma Invoice');
        }
        const piNumber = await this.generatePiNumber(user.companyId);
        const { items } = dto, piData = __rest(dto, ["items"]);
        const itemsData = (items || []).map((item, idx) => {
            const totalForeign = item.unitPriceForeign * item.qty;
            const totalInr = totalForeign * ipo.exchangeRate;
            return Object.assign(Object.assign({}, item), { totalForeign, totalInr, sequence: item.sequence || idx + 1, companyId: user.companyId, createdBy: user.id, updatedBy: user.id });
        });
        const subtotalForeign = itemsData.reduce((s, i) => s + i.totalForeign, 0);
        const totalAmount = subtotalForeign * ipo.exchangeRate;
        const pi = await this.prisma.proformaInvoice.create({
            data: Object.assign(Object.assign({}, piData), { piNumber, currency: ipo.currency, exchangeRate: ipo.exchangeRate, subtotalForeign,
                totalAmount, piDate: dto.piDate ? new Date(dto.piDate) : new Date(), validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined, status: 'RECEIVED', companyId: user.companyId, createdBy: user.id, updatedBy: user.id, items: itemsData.length > 0 ? { create: itemsData } : undefined }),
            include: this.includes(),
        });
        await this.prisma.importPurchaseOrder.update({
            where: { id: dto.ipoId },
            data: { status: 'PROFORMA_RECEIVED', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'proforma_invoices', recordId: pi.id, action: 'CREATE', newValues: pi, changedBy: user.id });
        return pi;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { piNumber: { contains: search, mode: 'insensitive' } },
                { vendorPiNumber: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.proformaInvoice.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    ipo: { select: { ipoNumber: true, currency: true, vendor: { select: { code: true, name: true } } } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.proformaInvoice.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const pi = await this.prisma.proformaInvoice.findFirst({ where, include: this.includes() });
        if (!pi)
            throw new common_1.NotFoundException('Proforma Invoice not found');
        return pi;
    }
    async findByIpo(ipoId, user) {
        const where = { ipoId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.proformaInvoice.findMany({
            where, orderBy: { createdAt: 'desc' },
            include: this.includes(),
        });
    }
    async update(id, dto, user) {
        const pi = await this.findOne(id, user);
        if (pi.status === 'ACCEPTED')
            throw new common_1.BadRequestException('Cannot edit an accepted Proforma Invoice');
        const updated = await this.prisma.proformaInvoice.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'proforma_invoices', recordId: id, action: 'UPDATE', oldValues: pi, newValues: updated, changedBy: user.id });
        return updated;
    }
    async accept(id, user) {
        const pi = await this.findOne(id, user);
        if (pi.status !== 'RECEIVED')
            throw new common_1.BadRequestException('Only RECEIVED Proforma Invoices can be accepted');
        const updated = await this.prisma.proformaInvoice.update({
            where: { id }, data: { status: 'ACCEPTED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'proforma_invoices', recordId: id, action: 'UPDATE', oldValues: pi, newValues: updated, changedBy: user.id });
        return updated;
    }
    async reject(id, dto, user) {
        const pi = await this.findOne(id, user);
        if (pi.status !== 'RECEIVED')
            throw new common_1.BadRequestException('Only RECEIVED Proforma Invoices can be rejected');
        const updated = await this.prisma.proformaInvoice.update({
            where: { id }, data: { status: 'REJECTED', rejectionReason: dto.rejectionReason, updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'proforma_invoices', recordId: id, action: 'UPDATE', oldValues: pi, newValues: updated, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, received, accepted, rejected] = await Promise.all([
            this.prisma.proformaInvoice.count({ where }),
            this.prisma.proformaInvoice.count({ where: Object.assign(Object.assign({}, where), { status: 'RECEIVED' }) }),
            this.prisma.proformaInvoice.count({ where: Object.assign(Object.assign({}, where), { status: 'ACCEPTED' }) }),
            this.prisma.proformaInvoice.count({ where: Object.assign(Object.assign({}, where), { status: 'REJECTED' }) }),
        ]);
        const totalValue = await this.prisma.proformaInvoice.aggregate({ where, _sum: { totalAmount: true, subtotalForeign: true } });
        return { total, received, accepted, rejected, totalValueInr: totalValue._sum.totalAmount || 0, totalValueForeign: totalValue._sum.subtotalForeign || 0 };
    }
};
exports.ProformaInvoiceService = ProformaInvoiceService;
exports.ProformaInvoiceService = ProformaInvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ProformaInvoiceService);
//# sourceMappingURL=proforma-invoice.service.js.map