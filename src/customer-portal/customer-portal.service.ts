import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerPortalService {
  constructor(private prisma: PrismaService) {}

  // Same SUPER_ADMIN company-scoping bypass used throughout the rest of
  // this codebase (e.g. PurchaseRequisitionService.findAll) - without it,
  // a Super Admin viewing a CPO that belongs to a different company gets
  // a 404 here, which the frontend swallows silently and renders as a
  // blank Dashboard tab with no error.
  private scopeWhere(user: any, extra: Record<string, any> = {}) {
    const where: any = { ...extra };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return where;
  }

  async getCustomerDashboard(customerId: string, user: any) {
    const customer = await this.prisma.customerPo.findFirst({
      where: this.scopeWhere(user, { id: customerId }),
    });
    if (!customer) throw new NotFoundException('Customer not found');

    // All four queries below must be scoped to this customer's own CPO
    // (cpoId / salesOrder.cpoId), not just the company - previously they
    // were company-wide, so every customer selected in the portal saw
    // the same totals and the same "recent orders" regardless of which
    // customer was picked.
    const [openOrders, pendingDeliveries, totalOrders, recentOrders] =
      await Promise.all([
        this.prisma.salesOrder.count({
          where: this.scopeWhere(user, {
            cpoId: customerId,
            status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          }),
        }),
        this.prisma.dispatch.count({
          where: this.scopeWhere(user, {
            status: 'DISPATCHED',
            salesOrder: { cpoId: customerId },
          }),
        }),
        this.prisma.salesOrder.count({
          where: this.scopeWhere(user, { cpoId: customerId }),
        }),
        this.prisma.salesOrder.findMany({
          where: this.scopeWhere(user, { cpoId: customerId }),
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            soNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      customer: {
        name: customer?.customerName || 'Customer',
        code: customer?.cpoNumber || '',
        email: '',
      },
      stats: { openOrders, pendingDeliveries, totalOrders },
      recentOrders,
    };
  }

  async getCustomerOrders(customerId: string, user: any, query: any) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    // Previously ignored customerId entirely - returned every order for
    // the whole company regardless of which customer was selected.
    const where: any = this.scopeWhere(user, {
      cpoId: customerId,
      isActive: true,
    });
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);
    return {
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async getCustomerDispatches(customerId: string, user: any) {
    // Same bug as getCustomerOrders - previously ignored customerId and
    // returned every dispatch for the whole company. Dispatch has no
    // direct cpoId column, so scope through its salesOrder relation.
    return this.prisma.dispatch.findMany({
      where: this.scopeWhere(user, {
        isActive: true,
        salesOrder: { cpoId: customerId },
      }),
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getCustomerComplaints(customerId: string, user: any) {
    return this.prisma.customerComplaint.findMany({
      where: this.scopeWhere(user, { customerId, isActive: true }),
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
