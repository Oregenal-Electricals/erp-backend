import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerPortalService {
  constructor(private prisma: PrismaService) {}

  async getCustomerDashboard(customerId: string, companyId: string) {
    const customer = await this.prisma.customerPo.findFirst({ where: { id: customerId, companyId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const [openOrders, pendingDeliveries, totalOrders, recentOrders] = await Promise.all([
      this.prisma.salesOrder.count({ where: { companyId, status: { in: ['CONFIRMED','IN_PROGRESS'] } } }),
      this.prisma.dispatch.count({ where: { companyId, status: 'DISPATCHED' } }),
      this.prisma.salesOrder.count({ where: { companyId } }),
      this.prisma.salesOrder.findMany({
        where: { companyId },
        take: 5, orderBy: { createdAt: 'desc' },
        select: { id: true, soNumber: true, totalAmount: true, status: true, createdAt: true },
      }),
    ]);

    return { customer: { name: customer?.customerName || 'Customer', code: customer?.cpoNumber || '', email: '' }, stats: { openOrders, pendingDeliveries, totalOrders }, recentOrders };
  }

  async getCustomerOrders(customerId: string, companyId: string, query: any) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (Number(page)-1)*Number(limit);
    const where: any = { companyId, isActive: true };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total/Number(limit)) };
  }

  async getCustomerDispatches(customerId: string, companyId: string) {
    return this.prisma.dispatch.findMany({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getCustomerComplaints(customerId: string, companyId: string) {
    return this.prisma.customerComplaint.findMany({
      where: { companyId, customerId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
