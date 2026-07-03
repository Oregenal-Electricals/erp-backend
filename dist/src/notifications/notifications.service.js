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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, companyId, createdBy) {
        return this.prisma.notification.create({
            data: {
                userId: dto.userId, type: dto.type, title: dto.title, message: dto.message,
                referenceType: dto.referenceType, referenceId: dto.referenceId,
                referenceNumber: dto.referenceNumber, priority: dto.priority || 'MEDIUM',
                companyId, createdBy, updatedBy: createdBy,
            },
        });
    }
    async createBulk(notifications, companyId, createdBy) {
        return this.prisma.notification.createMany({
            data: notifications.map(n => ({
                userId: n.userId, type: n.type, title: n.title, message: n.message,
                referenceType: n.referenceType, referenceId: n.referenceId,
                referenceNumber: n.referenceNumber, priority: n.priority || 'MEDIUM',
                companyId, createdBy, updatedBy: createdBy,
            })),
        });
    }
    async notifyCompany(companyId, type, title, message, opts = {}) {
        const users = await this.prisma.user.findMany({
            where: { companyId, isActive: true },
            select: { id: true },
        });
        if (users.length === 0)
            return;
        await this.prisma.notification.createMany({
            data: users.map(u => ({
                userId: u.id, type, title, message, companyId,
                referenceType: opts.referenceType, referenceId: opts.referenceId,
                referenceNumber: opts.referenceNumber, priority: opts.priority || 'MEDIUM',
                createdBy: opts.createdBy || 'system', updatedBy: opts.createdBy || 'system',
            })),
        });
    }
    async findAll(userId, companyId, query) {
        const { page = 1, limit = 20, unreadOnly, type } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { userId, companyId, isActive: true };
        if (unreadOnly === 'true')
            where.isRead = false;
        if (type)
            where.type = type;
        const [data, total, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
            }),
            this.prisma.notification.count({ where }),
            this.prisma.notification.count({ where: { userId, companyId, isRead: false, isActive: true } }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)), unreadCount };
    }
    async markRead(userId, companyId, ids) {
        const where = { userId, companyId, isRead: false };
        if (ids === null || ids === void 0 ? void 0 : ids.length)
            where.id = { in: ids };
        await this.prisma.notification.updateMany({
            where, data: { isRead: true, readAt: new Date(), updatedBy: userId },
        });
        const unreadCount = await this.prisma.notification.count({ where: { userId, companyId, isRead: false } });
        return { message: 'Marked as read', unreadCount };
    }
    async getUnreadCount(userId, companyId) {
        const count = await this.prisma.notification.count({ where: { userId, companyId, isRead: false, isActive: true } });
        return { unreadCount: count };
    }
    async deleteOld(userId, companyId) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        await this.prisma.notification.updateMany({
            where: { userId, companyId, isRead: true, createdAt: { lt: cutoff } },
            data: { isActive: false },
        });
        return { message: 'Old notifications cleared' };
    }
    async onSalesOrderCreated(so, companyId, userId) {
        var _a;
        await this.notifyCompany(companyId, 'SO_CREATED', `New Sales Order: ${so.soNumber}`, `Sales order ${so.soNumber} created for ${so.customerName} — ₹${(_a = so.totalAmount) === null || _a === void 0 ? void 0 : _a.toLocaleString()}`, { referenceType: 'SALES_ORDER', referenceId: so.id, referenceNumber: so.soNumber, priority: 'MEDIUM', createdBy: userId });
    }
    async onInvoiceOverdue(invoice, companyId) {
        var _a;
        await this.notifyCompany(companyId, 'INVOICE_OVERDUE', `Invoice Overdue: ${invoice.invoiceNumber}`, `Invoice ${invoice.invoiceNumber} for ${invoice.customerName} is overdue. Outstanding: ₹${(_a = invoice.outstandingAmount) === null || _a === void 0 ? void 0 : _a.toLocaleString()}`, { referenceType: 'AR_INVOICE', referenceId: invoice.id, referenceNumber: invoice.invoiceNumber, priority: 'HIGH', createdBy: 'system' });
    }
    async onCreditHold(hold, companyId, userId) {
        var _a;
        await this.notifyCompany(companyId, 'CREDIT_HOLD', `Credit Hold: ${hold.referenceNumber}`, `${hold.customerName} order ${hold.referenceNumber} placed on credit hold. Amount: ₹${(_a = hold.holdAmount) === null || _a === void 0 ? void 0 : _a.toLocaleString()}`, { referenceType: hold.referenceType, referenceId: hold.referenceId, referenceNumber: hold.referenceNumber, priority: 'URGENT', createdBy: userId });
    }
    async onDispatchCreated(dispatch, companyId, userId) {
        await this.notifyCompany(companyId, 'DISPATCH_DONE', `Dispatched: ${dispatch.dispatchNumber}`, `Dispatch ${dispatch.dispatchNumber} created for ${dispatch.customerName}`, { referenceType: 'DISPATCH', referenceId: dispatch.id, referenceNumber: dispatch.dispatchNumber, priority: 'LOW', createdBy: userId });
    }
    async onPaymentReceived(payment, invoice, companyId, userId) {
        var _a;
        await this.notifyCompany(companyId, 'PAYMENT_RECEIVED', `Payment Received: ${payment.paymentNumber}`, `Payment of ₹${(_a = payment.amount) === null || _a === void 0 ? void 0 : _a.toLocaleString()} received from ${invoice.customerName} for ${invoice.invoiceNumber}`, { referenceType: 'AR_PAYMENT', referenceId: payment.id, referenceNumber: payment.paymentNumber, priority: 'MEDIUM', createdBy: userId });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map