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
exports.PaymentInstrumentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let PaymentInstrumentService = class PaymentInstrumentService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(type, companyId) {
        const count = await this.prisma.paymentInstrument.count({ where: { companyId, instrumentType: type } });
        const year = new Date().getFullYear();
        return `${type}-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            ipo: { select: { ipoNumber: true, currency: true, status: true, vendor: { select: { code: true, name: true } } } },
            pi: { select: { piNumber: true, vendorPiNumber: true } },
        };
    }
    async create(dto, user) {
        const ipo = await this.prisma.importPurchaseOrder.findFirst({
            where: { id: dto.ipoId, companyId: user.companyId },
        });
        if (!ipo)
            throw new common_1.NotFoundException('Import PO not found');
        if (!['PROFORMA_RECEIVED', 'LC_OPENED'].includes(ipo.status)) {
            throw new common_1.BadRequestException('Import PO must have Proforma Invoice received before opening LC/TT');
        }
        const instrumentNumber = await this.generateNumber(dto.instrumentType, user.companyId);
        const instrument = await this.prisma.paymentInstrument.create({
            data: Object.assign(Object.assign({}, dto), { instrumentNumber, currency: ipo.currency, issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(), expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined, latestShipmentDate: dto.latestShipmentDate ? new Date(dto.latestShipmentDate) : undefined, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'payment_instruments', recordId: instrument.id, action: 'CREATE', newValues: instrument, changedBy: user.id });
        return instrument;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, instrumentType } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { instrumentNumber: { contains: search, mode: 'insensitive' } },
                { bankName: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (instrumentType)
            where.instrumentType = instrumentType;
        const [data, total] = await Promise.all([
            this.prisma.paymentInstrument.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { ipo: { select: { ipoNumber: true, currency: true, vendor: { select: { code: true, name: true } } } } },
            }),
            this.prisma.paymentInstrument.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const inst = await this.prisma.paymentInstrument.findFirst({ where, include: this.includes() });
        if (!inst)
            throw new common_1.NotFoundException('Payment Instrument not found');
        return inst;
    }
    async findByIpo(ipoId, user) {
        const where = { ipoId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.paymentInstrument.findMany({ where, orderBy: { createdAt: 'desc' }, include: this.includes() });
    }
    async update(id, dto, user) {
        const inst = await this.findOne(id, user);
        if (['SETTLED', 'CANCELLED'].includes(inst.status))
            throw new common_1.BadRequestException('Cannot edit settled or cancelled instrument');
        const updated = await this.prisma.paymentInstrument.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined, latestShipmentDate: dto.latestShipmentDate ? new Date(dto.latestShipmentDate) : undefined, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'payment_instruments', recordId: id, action: 'UPDATE', oldValues: inst, newValues: updated, changedBy: user.id });
        return updated;
    }
    async open(id, user) {
        const inst = await this.findOne(id, user);
        if (inst.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT instruments can be opened');
        const updated = await this.prisma.paymentInstrument.update({
            where: { id }, data: { status: 'OPENED', updatedBy: user.id }, include: this.includes(),
        });
        await this.prisma.importPurchaseOrder.update({
            where: { id: inst.ipoId }, data: { status: 'LC_OPENED', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'payment_instruments', recordId: id, action: 'UPDATE', oldValues: inst, newValues: updated, changedBy: user.id });
        return updated;
    }
    async settle(id, user) {
        const inst = await this.findOne(id, user);
        if (!['OPENED', 'AMENDED'].includes(inst.status))
            throw new common_1.BadRequestException('Only OPENED or AMENDED instruments can be settled');
        const updated = await this.prisma.paymentInstrument.update({
            where: { id }, data: { status: 'SETTLED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'payment_instruments', recordId: id, action: 'UPDATE', oldValues: inst, newValues: updated, changedBy: user.id });
        return updated;
    }
    async cancel(id, user) {
        const inst = await this.findOne(id, user);
        if (['SETTLED', 'CANCELLED'].includes(inst.status))
            throw new common_1.BadRequestException('Cannot cancel settled or already cancelled instrument');
        const updated = await this.prisma.paymentInstrument.update({
            where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'payment_instruments', recordId: id, action: 'UPDATE', oldValues: inst, newValues: updated, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, opened, settled, cancelled] = await Promise.all([
            this.prisma.paymentInstrument.count({ where }),
            this.prisma.paymentInstrument.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.paymentInstrument.count({ where: Object.assign(Object.assign({}, where), { status: 'OPENED' }) }),
            this.prisma.paymentInstrument.count({ where: Object.assign(Object.assign({}, where), { status: 'SETTLED' }) }),
            this.prisma.paymentInstrument.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
        ]);
        const totalValue = await this.prisma.paymentInstrument.aggregate({ where, _sum: { amountInr: true, amount: true } });
        const byType = await this.prisma.paymentInstrument.groupBy({ by: ['instrumentType'], where, _count: true, _sum: { amountInr: true } });
        return { total, draft, opened, settled, cancelled, totalValueInr: totalValue._sum.amountInr || 0, totalValueForeign: totalValue._sum.amount || 0, byType };
    }
};
exports.PaymentInstrumentService = PaymentInstrumentService;
exports.PaymentInstrumentService = PaymentInstrumentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], PaymentInstrumentService);
//# sourceMappingURL=payment-instrument.service.js.map