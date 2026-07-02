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
exports.CustomerPoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let CustomerPoService = class CustomerPoService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.customerPo.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `CPO-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    calcItem(item) {
        var _a;
        const qty = item.qty || 0;
        const unitPrice = item.unitPrice || 0;
        const discount = item.discount || 0;
        const gstRate = (_a = item.gstRate) !== null && _a !== void 0 ? _a : 18;
        const gross = qty * unitPrice;
        const discAmt = Math.round(gross * discount / 100 * 100) / 100;
        const taxableAmt = Math.round((gross - discAmt) * 100) / 100;
        const gstAmount = Math.round(taxableAmt * gstRate / 100 * 100) / 100;
        const totalAmount = Math.round((taxableAmt + gstAmount) * 100) / 100;
        return { taxableAmt, gstAmount, totalAmount, pendingQty: qty };
    }
    includes() {
        return {
            items: true,
            quotation: { select: { quotationNumber: true, revision: true, totalAmount: true } },
        };
    }
    async create(dto, user) {
        if (dto.quotationId) {
            const qt = await this.prisma.quotation.findFirst({ where: { id: dto.quotationId, companyId: user.companyId } });
            if (!qt)
                throw new common_1.NotFoundException('Quotation not found');
            if (qt.status !== 'ACCEPTED')
                throw new common_1.BadRequestException('Quotation must be ACCEPTED to create CPO');
        }
        const cpoNumber = await this.generateNumber(user.companyId);
        const calcItems = dto.items.map(item => {
            var _a;
            return (Object.assign(Object.assign({ itemCode: item.itemCode, itemName: item.itemName, description: item.description, qty: item.qty, uom: item.uom || 'PCS', unitPrice: item.unitPrice, discount: item.discount || 0, gstRate: (_a = item.gstRate) !== null && _a !== void 0 ? _a : 18 }, this.calcItem(item)), { createdBy: user.id, updatedBy: user.id }));
        });
        const subtotal = calcItems.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
        const totalGst = calcItems.reduce((s, i) => s + i.gstAmount, 0);
        const totalAmount = calcItems.reduce((s, i) => s + i.totalAmount, 0);
        const cpo = await this.prisma.customerPo.create({
            data: {
                cpoNumber, customerPoNumber: dto.customerPoNumber,
                quotationId: dto.quotationId,
                customerName: dto.customerName, customerEmail: dto.customerEmail,
                customerPhone: dto.customerPhone, deliveryAddress: dto.deliveryAddress,
                poDate: new Date(dto.poDate), deliveryDate: new Date(dto.deliveryDate),
                currency: dto.currency || 'INR', remarks: dto.remarks,
                subtotal: Math.round(subtotal * 100) / 100,
                totalGst: Math.round(totalGst * 100) / 100,
                totalAmount: Math.round(totalAmount * 100) / 100,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                items: { create: calcItems },
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customer_pos', recordId: cpo.id, action: 'CREATE', newValues: cpo, changedBy: user.id });
        return cpo;
    }
    async acknowledge(id, user) {
        const cpo = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId } });
        if (!cpo)
            throw new common_1.NotFoundException('CPO not found');
        if (cpo.status !== 'RECEIVED')
            throw new common_1.BadRequestException('Only RECEIVED CPOs can be acknowledged');
        const updated = await this.prisma.customerPo.update({
            where: { id },
            data: { status: 'ACKNOWLEDGED', acknowledgedDate: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customer_pos', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async cancel(id, dto, user) {
        const cpo = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId } });
        if (!cpo)
            throw new common_1.NotFoundException('CPO not found');
        if (['COMPLETED', 'CANCELLED'].includes(cpo.status))
            throw new common_1.BadRequestException(`Cannot cancel ${cpo.status} CPO`);
        const updated = await this.prisma.customerPo.update({
            where: { id },
            data: { status: 'CANCELLED', cancelledDate: new Date(), cancelReason: dto.cancelReason, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'customer_pos', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId };
        if (search)
            where.OR = [
                { cpoNumber: { contains: search, mode: 'insensitive' } },
                { customerPoNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.customerPo.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { items: { select: { id: true, itemCode: true, qty: true, deliveredQty: true, pendingQty: true } }, quotation: { select: { quotationNumber: true } } },
            }),
            this.prisma.customerPo.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const cpo = await this.prisma.customerPo.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!cpo)
            throw new common_1.NotFoundException('CPO not found');
        return cpo;
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [total, received, acknowledged, inProgress, completed, cancelled] = await Promise.all([
            this.prisma.customerPo.count({ where }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { status: 'RECEIVED' }) }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { status: 'ACKNOWLEDGED' }) }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { status: 'IN_PROGRESS' }) }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { status: 'COMPLETED' }) }),
            this.prisma.customerPo.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
        ]);
        const valueAgg = await this.prisma.customerPo.aggregate({
            where: Object.assign(Object.assign({}, where), { status: { notIn: ['CANCELLED'] } }), _sum: { totalAmount: true },
        });
        const overdueCount = await this.prisma.customerPo.count({
            where: Object.assign(Object.assign({}, where), { status: { in: ['ACKNOWLEDGED', 'IN_PROGRESS'] }, deliveryDate: { lt: new Date() } }),
        });
        return { total, received, acknowledged, inProgress, completed, cancelled, overdueCount, totalOrderValue: valueAgg._sum.totalAmount || 0 };
    }
};
exports.CustomerPoService = CustomerPoService;
exports.CustomerPoService = CustomerPoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], CustomerPoService);
//# sourceMappingURL=customer-po.service.js.map