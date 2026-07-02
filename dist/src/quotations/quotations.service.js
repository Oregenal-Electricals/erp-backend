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
exports.QuotationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let QuotationsService = class QuotationsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.quotation.count({ where: { companyId, revision: 0 } });
        const year = new Date().getFullYear();
        return `QT-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    calcItem(item) {
        var _a;
        const qty = item.qty || 0;
        const unitPrice = item.unitPrice || 0;
        const discountPct = item.discount || 0;
        const gstRate = (_a = item.gstRate) !== null && _a !== void 0 ? _a : 18;
        const grossAmt = qty * unitPrice;
        const discountAmt = Math.round(grossAmt * discountPct / 100 * 100) / 100;
        const taxableAmt = Math.round((grossAmt - discountAmt) * 100) / 100;
        const gstAmount = Math.round(taxableAmt * gstRate / 100 * 100) / 100;
        const cgst = Math.round(gstAmount / 2 * 100) / 100;
        const sgst = Math.round(gstAmount / 2 * 100) / 100;
        const totalAmount = Math.round((taxableAmt + gstAmount) * 100) / 100;
        return { discountAmt, taxableAmt, gstAmount, cgst, sgst, igst: 0, totalAmount };
    }
    calcTotals(items) {
        const subtotal = items.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
        const discountAmount = items.reduce((s, i) => s + i.discountAmt, 0);
        const taxableAmount = items.reduce((s, i) => s + i.taxableAmt, 0);
        const totalGst = items.reduce((s, i) => s + i.gstAmount, 0);
        const totalAmount = items.reduce((s, i) => s + i.totalAmount, 0);
        return {
            subtotal: Math.round(subtotal * 100) / 100,
            discountAmount: Math.round(discountAmount * 100) / 100,
            taxableAmount: Math.round(taxableAmount * 100) / 100,
            totalGst: Math.round(totalGst * 100) / 100,
            totalAmount: Math.round(totalAmount * 100) / 100,
        };
    }
    includes() {
        return { items: true, lead: { select: { leadNumber: true, companyName: true } } };
    }
    async create(dto, user) {
        const quotationNumber = await this.generateNumber(user.companyId);
        const calcItems = dto.items.map(item => {
            var _a;
            return (Object.assign(Object.assign({ itemCode: item.itemCode, itemName: item.itemName, description: item.description, qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice, discount: item.discount || 0, gstRate: (_a = item.gstRate) !== null && _a !== void 0 ? _a : 18 }, this.calcItem(item)), { createdBy: user.id, updatedBy: user.id }));
        });
        const totals = this.calcTotals(calcItems);
        const quotation = await this.prisma.quotation.create({
            data: Object.assign(Object.assign({ quotationNumber, revision: 0, leadId: dto.leadId, customerName: dto.customerName, customerEmail: dto.customerEmail, customerPhone: dto.customerPhone, customerAddress: dto.customerAddress, validUntil: new Date(dto.validUntil), currency: dto.currency || 'INR', termsConditions: dto.termsConditions, notes: dto.notes }, totals), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id, items: { create: calcItems } }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'quotations', recordId: quotation.id, action: 'CREATE', newValues: quotation, changedBy: user.id });
        return quotation;
    }
    async revise(id, dto, user) {
        const original = await this.prisma.quotation.findFirst({ where: { id, companyId: user.companyId } });
        if (!original)
            throw new common_1.NotFoundException('Quotation not found');
        if (!['SENT', 'REJECTED'].includes(original.status))
            throw new common_1.BadRequestException('Can only revise SENT or REJECTED quotations');
        const calcItems = dto.items.map(item => {
            var _a;
            return (Object.assign(Object.assign({ itemCode: item.itemCode, itemName: item.itemName, description: item.description, qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice, discount: item.discount || 0, gstRate: (_a = item.gstRate) !== null && _a !== void 0 ? _a : 18 }, this.calcItem(item)), { createdBy: user.id, updatedBy: user.id }));
        });
        const totals = this.calcTotals(calcItems);
        const revised = await this.prisma.quotation.create({
            data: Object.assign(Object.assign({ quotationNumber: original.quotationNumber, revision: original.revision + 1, leadId: original.leadId, customerName: dto.customerName || original.customerName, customerEmail: dto.customerEmail, customerPhone: dto.customerPhone, customerAddress: dto.customerAddress, validUntil: new Date(dto.validUntil), currency: original.currency, termsConditions: dto.termsConditions, notes: dto.notes }, totals), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id, items: { create: calcItems } }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'quotations', recordId: revised.id, action: 'CREATE', newValues: revised, changedBy: user.id });
        return revised;
    }
    async send(id, user) {
        const qt = await this.prisma.quotation.findFirst({ where: { id, companyId: user.companyId } });
        if (!qt)
            throw new common_1.NotFoundException('Quotation not found');
        if (qt.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT quotations can be sent');
        const updated = await this.prisma.quotation.update({
            where: { id }, data: { status: 'SENT', sentDate: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'quotations', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async accept(id, user) {
        const qt = await this.prisma.quotation.findFirst({ where: { id, companyId: user.companyId } });
        if (!qt)
            throw new common_1.NotFoundException('Quotation not found');
        if (qt.status !== 'SENT')
            throw new common_1.BadRequestException('Only SENT quotations can be accepted');
        const updated = await this.prisma.quotation.update({
            where: { id }, data: { status: 'ACCEPTED', acceptedDate: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        if (qt.leadId) {
            await this.prisma.lead.update({ where: { id: qt.leadId }, data: { status: 'CONVERTED', convertedToQuoteId: id, updatedBy: user.id } });
        }
        await this.audit.log({ tableName: 'quotations', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async reject(id, dto, user) {
        const qt = await this.prisma.quotation.findFirst({ where: { id, companyId: user.companyId } });
        if (!qt)
            throw new common_1.NotFoundException('Quotation not found');
        if (qt.status !== 'SENT')
            throw new common_1.BadRequestException('Only SENT quotations can be rejected');
        const updated = await this.prisma.quotation.update({
            where: { id },
            data: { status: 'REJECTED', rejectedDate: new Date(), rejectedReason: dto.rejectedReason, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'quotations', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId };
        if (search)
            where.OR = [
                { quotationNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.quotation.findMany({
                where, skip, take: Number(limit),
                orderBy: [{ quotationNumber: 'desc' }, { revision: 'desc' }],
                include: { items: { select: { id: true } }, lead: { select: { leadNumber: true } } },
            }),
            this.prisma.quotation.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const qt = await this.prisma.quotation.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!qt)
            throw new common_1.NotFoundException('Quotation not found');
        return qt;
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [total, draft, sent, accepted, rejected, expired] = await Promise.all([
            this.prisma.quotation.count({ where }),
            this.prisma.quotation.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.quotation.count({ where: Object.assign(Object.assign({}, where), { status: 'SENT' }) }),
            this.prisma.quotation.count({ where: Object.assign(Object.assign({}, where), { status: 'ACCEPTED' }) }),
            this.prisma.quotation.count({ where: Object.assign(Object.assign({}, where), { status: 'REJECTED' }) }),
            this.prisma.quotation.count({ where: Object.assign(Object.assign({}, where), { status: 'EXPIRED' }) }),
        ]);
        const valueAgg = await this.prisma.quotation.aggregate({ where: Object.assign(Object.assign({}, where), { status: 'SENT' }), _sum: { totalAmount: true } });
        return { total, draft, sent, accepted, rejected, expired, pendingValue: valueAgg._sum.totalAmount || 0 };
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], QuotationsService);
//# sourceMappingURL=quotations.service.js.map