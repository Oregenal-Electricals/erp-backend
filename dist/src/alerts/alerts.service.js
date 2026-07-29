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
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const DEFAULT_TEMPLATES = [
    { eventType: 'INVOICE_OVERDUE', channel: 'EMAIL', subject: 'Invoice {{invoiceNumber}} is Overdue', bodyTemplate: 'Dear {{customerName}},\n\nThis is a reminder that invoice {{invoiceNumber}} dated {{invoiceDate}} for ₹{{amount}} is now overdue.\n\nPlease arrange payment at the earliest.\n\nRegards,\nAccounts Team', recipients: 'BOTH' },
    { eventType: 'DISPATCH_CREATED', channel: 'EMAIL', subject: 'Your Order {{soNumber}} has been Dispatched', bodyTemplate: 'Dear {{customerName}},\n\nYour order {{soNumber}} has been dispatched via {{transport}} on {{dispatchDate}}.\n\nTracking: {{lrNumber}}\nExpected Delivery: {{deliveryDate}}\n\nRegards,\nLogistics Team', recipients: 'CUSTOMER' },
    { eventType: 'PAYMENT_RECEIVED', channel: 'EMAIL', subject: 'Payment Received for {{invoiceNumber}}', bodyTemplate: 'Dear {{customerName}},\n\nWe acknowledge receipt of ₹{{amount}} against invoice {{invoiceNumber}} via {{paymentMode}}.\n\nOutstanding balance: ₹{{outstanding}}\n\nThank you for your payment.\n\nRegards,\nAccounts Team', recipients: 'CUSTOMER' },
    { eventType: 'CREDIT_HOLD', channel: 'EMAIL', subject: 'Credit Hold Placed: {{referenceNumber}}', bodyTemplate: 'This is to inform that order {{referenceNumber}} for {{customerName}} has been placed on credit hold.\n\nOutstanding: ₹{{outstanding}}\nCredit Limit: ₹{{limit}}\n\nPlease review and take action.', recipients: 'INTERNAL' },
    { eventType: 'PO_APPROVED', channel: 'EMAIL', subject: 'Purchase Order {{poNumber}} Approved', bodyTemplate: 'Purchase Order {{poNumber}} has been approved.\n\nVendor: {{vendorName}}\nValue: ₹{{amount}}\nDelivery Date: {{deliveryDate}}\n\nPlease proceed with supply.', recipients: 'INTERNAL' },
    { eventType: 'SO_CONFIRMED', channel: 'EMAIL', subject: 'Sales Order {{soNumber}} Confirmed', bodyTemplate: 'Dear {{customerName}},\n\nYour sales order {{soNumber}} has been confirmed.\n\nValue: ₹{{amount}}\nExpected Delivery: {{deliveryDate}}\n\nThank you for your business.', recipients: 'CUSTOMER' },
    { eventType: 'NCR_RAISED', channel: 'EMAIL', subject: 'NCR {{ncrNumber}} Raised', bodyTemplate: 'An NCR has been raised:\n\nNCR Number: {{ncrNumber}}\nSource: {{source}}\nDescription: {{description}}\n\nPlease initiate Root Cause Analysis within 24 hours.', recipients: 'INTERNAL' },
];
let AlertsService = class AlertsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    renderTemplate(template, variables = {}) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
    }
    async seedDefaultTemplates(companyId, userId) {
        const existing = await this.prisma.alertTemplate.count({ where: { companyId } });
        if (existing > 0)
            return { message: 'Templates already seeded', count: existing };
        await this.prisma.alertTemplate.createMany({
            data: DEFAULT_TEMPLATES.map(t => (Object.assign(Object.assign({}, t), { companyId, createdBy: userId, updatedBy: userId }))),
        });
        return { message: 'Default templates seeded', count: DEFAULT_TEMPLATES.length };
    }
    async trigger(dto, companyId, userId) {
        var _a, _b;
        const template = await this.prisma.alertTemplate.findFirst({
            where: { companyId, eventType: dto.eventType, isActive: true },
        });
        if (!template) {
            await this.prisma.alertLog.create({
                data: {
                    eventType: dto.eventType, channel: 'EMAIL', recipient: 'N/A',
                    body: `No template found for ${dto.eventType}`, status: 'FAILED',
                    errorMessage: 'No active template configured',
                    referenceType: dto.referenceType, referenceId: dto.referenceId,
                    referenceNumber: dto.referenceNumber,
                    companyId, createdBy: userId, updatedBy: userId,
                },
            });
            return { sent: false, reason: 'No active template found' };
        }
        const subject = this.renderTemplate(template.subject, dto.variables || {});
        const body = this.renderTemplate(template.bodyTemplate, dto.variables || {});
        const internalEmails = ((_a = template.recipientEmails) === null || _a === void 0 ? void 0 : _a.split(',').map(e => e.trim()).filter(Boolean)) || [];
        const customerEmail = (_b = dto.variables) === null || _b === void 0 ? void 0 : _b.customerEmail;
        const recipients = [];
        if (template.recipients === 'INTERNAL' || template.recipients === 'BOTH') {
            recipients.push(...internalEmails);
        }
        if ((template.recipients === 'CUSTOMER' || template.recipients === 'BOTH') && customerEmail) {
            recipients.push(customerEmail);
        }
        if (recipients.length === 0)
            recipients.push('alerts@internal');
        const logs = await Promise.all(recipients.map(async (recipient) => {
            const log = await this.prisma.alertLog.create({
                data: {
                    templateId: template.id, eventType: dto.eventType,
                    channel: template.channel, recipient, subject, body,
                    status: 'SENT', sentAt: new Date(),
                    referenceType: dto.referenceType, referenceId: dto.referenceId,
                    referenceNumber: dto.referenceNumber,
                    companyId, createdBy: userId, updatedBy: userId,
                },
            });
            return log;
        }));
        return { sent: true, recipientCount: logs.length, eventType: dto.eventType };
    }
    async createTemplate(dto, user) {
        const template = await this.prisma.alertTemplate.create({
            data: {
                eventType: dto.eventType, channel: dto.channel || 'EMAIL',
                subject: dto.subject, bodyTemplate: dto.bodyTemplate,
                recipients: dto.recipients || 'INTERNAL', recipientEmails: dto.recipientEmails,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
        });
        await this.audit.log({ tableName: 'alert_templates', recordId: template.id, action: 'CREATE', newValues: template, changedBy: user.id });
        return template;
    }
    async updateTemplate(id, dto, user) {
        const updated = await this.prisma.alertTemplate.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'alert_templates', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAllTemplates(user) {
        return this.prisma.alertTemplate.findMany({
            where: { companyId: user.companyId },
            orderBy: { eventType: 'asc' },
        });
    }
    async findAllLogs(user, query) {
        const { page = 1, limit = 20, status, eventType } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId };
        if (status)
            where.status = status;
        if (eventType)
            where.eventType = eventType;
        const [data, total] = await Promise.all([
            this.prisma.alertLog.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
            this.prisma.alertLog.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [total, sent, failed, pending, templates] = await Promise.all([
            this.prisma.alertLog.count({ where }),
            this.prisma.alertLog.count({ where: Object.assign(Object.assign({}, where), { status: 'SENT' }) }),
            this.prisma.alertLog.count({ where: Object.assign(Object.assign({}, where), { status: 'FAILED' }) }),
            this.prisma.alertLog.count({ where: Object.assign(Object.assign({}, where), { status: 'PENDING' }) }),
            this.prisma.alertTemplate.count({ where: { companyId: user.companyId, isActive: true } }),
        ]);
        return { total, sent, failed, pending, activeTemplates: templates };
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map