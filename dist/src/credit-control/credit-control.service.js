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
exports.CreditControlService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let CreditControlService = class CreditControlService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async getCustomerPosition(customerName, companyId) {
        const [creditLimit, arData, activeHolds] = await Promise.all([
            this.prisma.customerCreditLimit.findUnique({ where: { companyId_customerName: { companyId, customerName } } }),
            this.prisma.arInvoice.aggregate({
                where: { companyId, customerName, status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } },
                _sum: { outstandingAmount: true, totalAmount: true },
                _count: { id: true },
            }),
            this.prisma.creditHold.findMany({
                where: { companyId, customerName, status: 'HELD' },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        const outstanding = arData._sum.outstandingAmount || 0;
        const limit = (creditLimit === null || creditLimit === void 0 ? void 0 : creditLimit.creditLimit) || 0;
        const available = Math.max(0, limit - outstanding);
        const utilizationPct = limit > 0 ? Math.round(outstanding / limit * 100 * 100) / 100 : 0;
        return {
            customerName, creditLimit: limit, creditDays: (creditLimit === null || creditLimit === void 0 ? void 0 : creditLimit.creditDays) || 30,
            outstandingAmount: outstanding, availableCredit: available,
            utilizationPct, invoiceCount: arData._count.id,
            activeHolds: activeHolds.length, holds: activeHolds,
            isOverLimit: outstanding > limit && limit > 0,
            hasLimit: !!creditLimit,
        };
    }
    async checkCredit(dto, user) {
        const position = await this.getCustomerPosition(dto.customerName, user.companyId);
        if (!position.hasLimit)
            return {
                allowed: true, reason: 'No credit limit set for this customer',
                position, holdCreated: false,
            };
        const totalExposure = position.outstandingAmount + dto.orderAmount;
        const allowed = totalExposure <= position.creditLimit;
        if (!allowed && dto.referenceType && dto.referenceId) {
            const hold = await this.prisma.creditHold.create({
                data: {
                    customerName: dto.customerName, creditLimitId: null,
                    referenceType: dto.referenceType, referenceId: dto.referenceId,
                    referenceNumber: dto.referenceNumber || '',
                    holdReason: `Credit limit exceeded. Outstanding: ₹${position.outstandingAmount.toLocaleString()}, Order: ₹${dto.orderAmount.toLocaleString()}, Limit: ₹${position.creditLimit.toLocaleString()}`,
                    holdAmount: dto.orderAmount, outstandingAtHold: position.outstandingAmount,
                    creditLimitAtHold: position.creditLimit,
                    companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                },
            });
            await this.audit.log({ tableName: 'credit_holds', recordId: hold.id, action: 'CREATE', newValues: hold, changedBy: user.id });
            return { allowed: false, reason: hold.holdReason, position, holdCreated: true, holdId: hold.id };
        }
        return { allowed, reason: allowed ? 'Credit check passed' : 'Credit limit would be exceeded', position, holdCreated: false };
    }
    async createCreditLimit(dto, user) {
        const existing = await this.prisma.customerCreditLimit.findUnique({
            where: { companyId_customerName: { companyId: user.companyId, customerName: dto.customerName } },
        });
        if (existing)
            throw new common_1.BadRequestException(`Credit limit already exists for ${dto.customerName}`);
        const limit = await this.prisma.customerCreditLimit.create({
            data: {
                customerName: dto.customerName, creditLimit: dto.creditLimit,
                creditDays: dto.creditDays || 30, notes: dto.notes,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
        });
        await this.audit.log({ tableName: 'customer_credit_limits', recordId: limit.id, action: 'CREATE', newValues: limit, changedBy: user.id });
        return limit;
    }
    async updateCreditLimit(id, dto, user) {
        const limit = await this.prisma.customerCreditLimit.findFirst({ where: { id, companyId: user.companyId } });
        if (!limit)
            throw new common_1.NotFoundException('Credit limit not found');
        const updated = await this.prisma.customerCreditLimit.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'customer_credit_limits', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async releaseHold(id, dto, user) {
        const hold = await this.prisma.creditHold.findFirst({ where: { id, companyId: user.companyId } });
        if (!hold)
            throw new common_1.NotFoundException('Credit hold not found');
        if (hold.status !== 'HELD')
            throw new common_1.BadRequestException(`Hold is already ${hold.status}`);
        const updated = await this.prisma.creditHold.update({
            where: { id },
            data: { status: 'RELEASED', releasedBy: user.id, releaseReason: dto.releaseReason, releasedDate: new Date(), updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'credit_holds', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAllLimits(user) {
        const limits = await this.prisma.customerCreditLimit.findMany({
            where: { companyId: user.companyId, isActive: true },
            orderBy: { customerName: 'asc' },
        });
        const enriched = await Promise.all(limits.map(async (l) => {
            const pos = await this.getCustomerPosition(l.customerName, user.companyId);
            return Object.assign(Object.assign({}, l), pos);
        }));
        return enriched;
    }
    async findAllHolds(user, query) {
        const { status, customerName } = query;
        const where = { companyId: user.companyId };
        if (status)
            where.status = status;
        if (customerName)
            where.customerName = { contains: customerName, mode: 'insensitive' };
        return this.prisma.creditHold.findMany({
            where, orderBy: { createdAt: 'desc' },
        });
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [totalLimits, totalHolds, activeHolds, overLimitCustomers] = await Promise.all([
            this.prisma.customerCreditLimit.count({ where }),
            this.prisma.creditHold.count({ where }),
            this.prisma.creditHold.count({ where: Object.assign(Object.assign({}, where), { status: 'HELD' }) }),
            this.prisma.customerCreditLimit.count({ where }),
        ]);
        const holdValue = await this.prisma.creditHold.aggregate({ where: Object.assign(Object.assign({}, where), { status: 'HELD' }), _sum: { holdAmount: true } });
        return { totalLimits, totalHolds, activeHolds, holdValue: holdValue._sum.holdAmount || 0 };
    }
    async getDashboard(user) {
        const limits = await this.findAllLimits(user);
        const overLimit = limits.filter(l => l.isOverLimit);
        const atRisk = limits.filter(l => l.utilizationPct >= 80 && !l.isOverLimit);
        const healthy = limits.filter(l => l.utilizationPct < 80);
        const totalExposure = limits.reduce((s, l) => s + l.outstandingAmount, 0);
        const totalLimit = limits.reduce((s, l) => s + l.creditLimit, 0);
        return { limits, overLimit, atRisk, healthy, totalExposure, totalLimit, utilizationPct: totalLimit > 0 ? Math.round(totalExposure / totalLimit * 100) : 0 };
    }
};
exports.CreditControlService = CreditControlService;
exports.CreditControlService = CreditControlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], CreditControlService);
//# sourceMappingURL=credit-control.service.js.map