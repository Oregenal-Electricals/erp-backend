import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateAlertTemplateDto, UpdateAlertTemplateDto, TriggerAlertDto } from './dto/alert.dto';

const DEFAULT_TEMPLATES = [
  { eventType:'INVOICE_OVERDUE', channel:'EMAIL', subject:'Invoice {{invoiceNumber}} is Overdue', bodyTemplate:'Dear {{customerName}},\n\nThis is a reminder that invoice {{invoiceNumber}} dated {{invoiceDate}} for ₹{{amount}} is now overdue.\n\nPlease arrange payment at the earliest.\n\nRegards,\nAccounts Team', recipients:'BOTH' },
  { eventType:'DISPATCH_CREATED', channel:'EMAIL', subject:'Your Order {{soNumber}} has been Dispatched', bodyTemplate:'Dear {{customerName}},\n\nYour order {{soNumber}} has been dispatched via {{transport}} on {{dispatchDate}}.\n\nTracking: {{lrNumber}}\nExpected Delivery: {{deliveryDate}}\n\nRegards,\nLogistics Team', recipients:'CUSTOMER' },
  { eventType:'PAYMENT_RECEIVED', channel:'EMAIL', subject:'Payment Received for {{invoiceNumber}}', bodyTemplate:'Dear {{customerName}},\n\nWe acknowledge receipt of ₹{{amount}} against invoice {{invoiceNumber}} via {{paymentMode}}.\n\nOutstanding balance: ₹{{outstanding}}\n\nThank you for your payment.\n\nRegards,\nAccounts Team', recipients:'CUSTOMER' },
  { eventType:'CREDIT_HOLD', channel:'EMAIL', subject:'Credit Hold Placed: {{referenceNumber}}', bodyTemplate:'This is to inform that order {{referenceNumber}} for {{customerName}} has been placed on credit hold.\n\nOutstanding: ₹{{outstanding}}\nCredit Limit: ₹{{limit}}\n\nPlease review and take action.', recipients:'INTERNAL' },
  { eventType:'PO_APPROVED', channel:'EMAIL', subject:'Purchase Order {{poNumber}} Approved', bodyTemplate:'Purchase Order {{poNumber}} has been approved.\n\nVendor: {{vendorName}}\nValue: ₹{{amount}}\nDelivery Date: {{deliveryDate}}\n\nPlease proceed with supply.', recipients:'INTERNAL' },
  { eventType:'SO_CONFIRMED', channel:'EMAIL', subject:'Sales Order {{soNumber}} Confirmed', bodyTemplate:'Dear {{customerName}},\n\nYour sales order {{soNumber}} has been confirmed.\n\nValue: ₹{{amount}}\nExpected Delivery: {{deliveryDate}}\n\nThank you for your business.', recipients:'CUSTOMER' },
  { eventType:'NCR_RAISED', channel:'EMAIL', subject:'NCR {{ncrNumber}} Raised', bodyTemplate:'An NCR has been raised:\n\nNCR Number: {{ncrNumber}}\nSource: {{source}}\nDescription: {{description}}\n\nPlease initiate Root Cause Analysis within 24 hours.', recipients:'INTERNAL' },
];

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private renderTemplate(template: string, variables: Record<string, string> = {}): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
  }

  async seedDefaultTemplates(companyId: string, userId: string) {
    const existing = await this.prisma.alertTemplate.count({ where: { companyId } });
    if (existing > 0) return { message: 'Templates already seeded', count: existing };

    await this.prisma.alertTemplate.createMany({
      data: DEFAULT_TEMPLATES.map(t => ({ ...t, companyId, createdBy: userId, updatedBy: userId })),
    });
    return { message: 'Default templates seeded', count: DEFAULT_TEMPLATES.length };
  }

  async trigger(dto: TriggerAlertDto, companyId: string, userId: string) {
    const template = await this.prisma.alertTemplate.findFirst({
      where: { companyId, eventType: dto.eventType, isActive: true },
    });

    if (!template) {
      // Log as pending without template
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

    // Determine recipients
    const internalEmails = template.recipientEmails?.split(',').map(e => e.trim()).filter(Boolean) || [];
    const customerEmail = dto.variables?.customerEmail;
    const recipients: string[] = [];

    if (template.recipients === 'INTERNAL' || template.recipients === 'BOTH') {
      recipients.push(...internalEmails);
    }
    if ((template.recipients === 'CUSTOMER' || template.recipients === 'BOTH') && customerEmail) {
      recipients.push(customerEmail);
    }
    if (recipients.length === 0) recipients.push('alerts@internal');

    // Log each alert (simulated send - SMTP integration point)
    const logs = await Promise.all(recipients.map(async recipient => {
      const log = await this.prisma.alertLog.create({
        data: {
          templateId: template.id, eventType: dto.eventType,
          channel: template.channel, recipient, subject, body,
          status: 'SENT', sentAt: new Date(), // Mark as SENT (simulated)
          referenceType: dto.referenceType, referenceId: dto.referenceId,
          referenceNumber: dto.referenceNumber,
          companyId, createdBy: userId, updatedBy: userId,
        },
      });
      return log;
    }));

    return { sent: true, recipientCount: logs.length, eventType: dto.eventType };
  }

  async createTemplate(dto: CreateAlertTemplateDto, user: any) {
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

  async updateTemplate(id: string, dto: UpdateAlertTemplateDto, user: any) {
    const updated = await this.prisma.alertTemplate.update({
      where: { id }, data: { ...dto, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'alert_templates', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAllTemplates(user: any) {
    return this.prisma.alertTemplate.findMany({
      where: { companyId: user.companyId },
      orderBy: { eventType: 'asc' },
    });
  }

  async findAllLogs(user: any, query: any) {
    const { page = 1, limit = 20, status, eventType } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    if (eventType) where.eventType = eventType;

    const [data, total] = await Promise.all([
      this.prisma.alertLog.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      this.prisma.alertLog.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, sent, failed, pending, templates] = await Promise.all([
      this.prisma.alertLog.count({ where }),
      this.prisma.alertLog.count({ where: { ...where, status: 'SENT' } }),
      this.prisma.alertLog.count({ where: { ...where, status: 'FAILED' } }),
      this.prisma.alertLog.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.alertTemplate.count({ where: { companyId: user.companyId, isActive: true } }),
    ]);
    return { total, sent, failed, pending, activeTemplates: templates };
  }
}
