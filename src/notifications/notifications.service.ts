import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto, companyId: string, createdBy: string) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId, type: dto.type, title: dto.title, message: dto.message,
        referenceType: dto.referenceType, referenceId: dto.referenceId,
        referenceNumber: dto.referenceNumber, priority: dto.priority || 'MEDIUM',
        companyId, createdBy, updatedBy: createdBy,
      },
    });
  }

  async createBulk(notifications: CreateNotificationDto[], companyId: string, createdBy: string) {
    return this.prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId, type: n.type, title: n.title, message: n.message,
        referenceType: n.referenceType, referenceId: n.referenceId,
        referenceNumber: n.referenceNumber, priority: n.priority || 'MEDIUM',
        companyId, createdBy, updatedBy: createdBy,
      })),
    });
  }

  // Notify all admins/managers in company
  async notifyCompany(companyId: string, type: string, title: string, message: string, opts: any = {}) {
    const users = await this.prisma.user.findMany({
      where: { companyId, isActive: true },
      select: { id: true },
    });
    if (users.length === 0) return;
    await this.prisma.notification.createMany({
      data: users.map(u => ({
        userId: u.id, type, title, message, companyId,
        referenceType: opts.referenceType, referenceId: opts.referenceId,
        referenceNumber: opts.referenceNumber, priority: opts.priority || 'MEDIUM',
        createdBy: opts.createdBy || 'system', updatedBy: opts.createdBy || 'system',
      })),
    });
  }

  async findAll(userId: string, companyId: string, query: any) {
    const { page = 1, limit = 20, unreadOnly, type } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { userId, companyId, isActive: true };
    if (unreadOnly === 'true') where.isRead = false;
    if (type) where.type = type;

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, companyId, isRead: false, isActive: true } }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)), unreadCount };
  }

  async markRead(userId: string, companyId: string, ids?: string[]) {
    const where: any = { userId, companyId, isRead: false };
    if (ids?.length) where.id = { in: ids };

    await this.prisma.notification.updateMany({
      where, data: { isRead: true, readAt: new Date(), updatedBy: userId },
    });
    const unreadCount = await this.prisma.notification.count({ where: { userId, companyId, isRead: false } });
    return { message: 'Marked as read', unreadCount };
  }

  async getUnreadCount(userId: string, companyId: string) {
    const count = await this.prisma.notification.count({ where: { userId, companyId, isRead: false, isActive: true } });
    return { unreadCount: count };
  }

  async deleteOld(userId: string, companyId: string) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    await this.prisma.notification.updateMany({
      where: { userId, companyId, isRead: true, createdAt: { lt: cutoff } },
      data: { isActive: false },
    });
    return { message: 'Old notifications cleared' };
  }

  // Event-driven notification triggers
  async onSalesOrderCreated(so: any, companyId: string, userId: string) {
    await this.notifyCompany(companyId, 'SO_CREATED',
      `New Sales Order: ${so.soNumber}`,
      `Sales order ${so.soNumber} created for ${so.customerName} — ₹${so.totalAmount?.toLocaleString()}`,
      { referenceType: 'SALES_ORDER', referenceId: so.id, referenceNumber: so.soNumber, priority: 'MEDIUM', createdBy: userId }
    );
  }

  async onInvoiceOverdue(invoice: any, companyId: string) {
    await this.notifyCompany(companyId, 'INVOICE_OVERDUE',
      `Invoice Overdue: ${invoice.invoiceNumber}`,
      `Invoice ${invoice.invoiceNumber} for ${invoice.customerName} is overdue. Outstanding: ₹${invoice.outstandingAmount?.toLocaleString()}`,
      { referenceType: 'AR_INVOICE', referenceId: invoice.id, referenceNumber: invoice.invoiceNumber, priority: 'HIGH', createdBy: 'system' }
    );
  }

  async onCreditHold(hold: any, companyId: string, userId: string) {
    await this.notifyCompany(companyId, 'CREDIT_HOLD',
      `Credit Hold: ${hold.referenceNumber}`,
      `${hold.customerName} order ${hold.referenceNumber} placed on credit hold. Amount: ₹${hold.holdAmount?.toLocaleString()}`,
      { referenceType: hold.referenceType, referenceId: hold.referenceId, referenceNumber: hold.referenceNumber, priority: 'URGENT', createdBy: userId }
    );
  }

  async onDispatchCreated(dispatch: any, companyId: string, userId: string) {
    await this.notifyCompany(companyId, 'DISPATCH_DONE',
      `Dispatched: ${dispatch.dispatchNumber}`,
      `Dispatch ${dispatch.dispatchNumber} created for ${dispatch.customerName}`,
      { referenceType: 'DISPATCH', referenceId: dispatch.id, referenceNumber: dispatch.dispatchNumber, priority: 'LOW', createdBy: userId }
    );
  }

  async onPaymentReceived(payment: any, invoice: any, companyId: string, userId: string) {
    await this.notifyCompany(companyId, 'PAYMENT_RECEIVED',
      `Payment Received: ${payment.paymentNumber}`,
      `Payment of ₹${payment.amount?.toLocaleString()} received from ${invoice.customerName} for ${invoice.invoiceNumber}`,
      { referenceType: 'AR_PAYMENT', referenceId: payment.id, referenceNumber: payment.paymentNumber, priority: 'MEDIUM', createdBy: userId }
    );
  }
}
