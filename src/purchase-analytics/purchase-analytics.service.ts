import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchaseAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(user: any) {
    const companyId = user.companyId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalPos, totalPrValue, monthlyPoValue, yearlyPoValue,
      pendingPrs, pendingPos, sentPos,
      totalRfqs, totalVendorQuotations, totalAmendments,
    ] = await Promise.all([
      this.prisma.purchaseOrder.count({ where: { companyId } }),
      this.prisma.purchaseRequisition.aggregate({ where: { companyId }, _sum: { totalAmount: true } }),
      this.prisma.purchaseOrder.aggregate({ where: { companyId, createdAt: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      this.prisma.purchaseOrder.aggregate({ where: { companyId, createdAt: { gte: startOfYear } }, _sum: { totalAmount: true } }),
      this.prisma.purchaseRequisition.count({ where: { companyId, status: 'SUBMITTED' } }),
      this.prisma.purchaseOrder.count({ where: { companyId, status: 'DRAFT' } }),
      this.prisma.purchaseOrder.count({ where: { companyId, status: 'SENT' } }),
      this.prisma.rfq.count({ where: { companyId } }),
      this.prisma.vendorQuotation.count({ where: { companyId } }),
      this.prisma.poAmendment.count({ where: { companyId } }),
    ]);

    const totalPoValue = await this.prisma.purchaseOrder.aggregate({ where: { companyId }, _sum: { totalAmount: true } });
    const approvedPoValue = await this.prisma.purchaseOrder.aggregate({ where: { companyId, status: { in: ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'CLOSED'] } }, _sum: { totalAmount: true } });

    return {
      totalPos,
      totalPoValue: totalPoValue._sum.totalAmount || 0,
      approvedPoValue: approvedPoValue._sum.totalAmount || 0,
      monthlyPoValue: monthlyPoValue._sum.totalAmount || 0,
      yearlyPoValue: yearlyPoValue._sum.totalAmount || 0,
      totalPrValue: totalPrValue._sum.totalAmount || 0,
      pendingPrs,
      pendingPos,
      sentPos,
      totalRfqs,
      totalVendorQuotations,
      totalAmendments,
    };
  }

  async getSpendByVendor(user: any, limit = 10) {
    const companyId = user.companyId;
    const pos = await this.prisma.purchaseOrder.findMany({
      where: { companyId, status: { in: ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'CLOSED'] } },
      include: { vendor: { select: { id: true, code: true, name: true } } },
    });

    const vendorMap: Record<string, any> = {};
    for (const po of pos) {
      const vid = po.vendorId;
      if (!vendorMap[vid]) {
        vendorMap[vid] = { vendorId: vid, vendorCode: po.vendor.code, vendorName: po.vendor.name, totalSpend: 0, poCount: 0 };
      }
      vendorMap[vid].totalSpend += po.totalAmount || 0;
      vendorMap[vid].poCount += 1;
    }

    return Object.values(vendorMap)
      .sort((a: any, b: any) => b.totalSpend - a.totalSpend)
      .slice(0, limit);
  }

  async getSpendByMonth(user: any) {
    const companyId = user.companyId;
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const pos = await this.prisma.purchaseOrder.findMany({
      where: { companyId, createdAt: { gte: startOfYear }, status: { in: ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'CLOSED'] } },
      select: { totalAmount: true, createdAt: true },
    });

    const monthlyData: Record<string, number> = {};
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    months.forEach(m => { monthlyData[m] = 0; });

    for (const po of pos) {
      const month = months[po.createdAt.getMonth()];
      monthlyData[month] += po.totalAmount || 0;
    }

    return months.map(month => ({ month, amount: monthlyData[month] }));
  }

  async getPoStatusDistribution(user: any) {
    const companyId = user.companyId;
    const statuses = ['DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'CLOSED', 'CANCELLED'];
    const counts = await Promise.all(
      statuses.map(status => this.prisma.purchaseOrder.count({ where: { companyId, status } }))
    );
    return statuses.map((status, i) => ({ status, count: counts[i] })).filter(s => s.count > 0);
  }

  async getPrToPoTime(user: any) {
    const companyId = user.companyId;
    const pos = await this.prisma.purchaseOrder.findMany({
      where: { companyId, prId: { not: null }, approvedAt: { not: null } },
      include: { pr: { select: { createdAt: true, prNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const cycles = pos
      .filter(po => po.pr)
      .map(po => {
        const prDate = new Date(po.pr!.createdAt);
        const poDate = po.approvedAt ? new Date(po.approvedAt) : new Date(po.createdAt);
        const days = Math.round((poDate.getTime() - prDate.getTime()) / (1000 * 60 * 60 * 24));
        return { poNumber: po.poNumber, prNumber: po.pr!.prNumber, cycleDays: days };
      });

    const avgDays = cycles.length > 0 ? Math.round(cycles.reduce((s, c) => s + c.cycleDays, 0) / cycles.length) : 0;
    return { avgCycleDays: avgDays, cycles };
  }

  async getRfqConversion(user: any) {
    const companyId = user.companyId;
    const [totalRfqs, closedRfqs, totalPos, posWithRfq] = await Promise.all([
      this.prisma.rfq.count({ where: { companyId } }),
      this.prisma.rfq.count({ where: { companyId, status: 'CLOSED' } }),
      this.prisma.purchaseOrder.count({ where: { companyId } }),
      this.prisma.purchaseOrder.count({ where: { companyId, rfqId: { not: null } } }),
    ]);

    const conversionRate = totalRfqs > 0 ? Math.round((posWithRfq / totalRfqs) * 100) : 0;
    const rfqUtilization = totalPos > 0 ? Math.round((posWithRfq / totalPos) * 100) : 0;

    return { totalRfqs, closedRfqs, totalPos, posWithRfq, conversionRate, rfqUtilization };
  }

  async getTopItems(user: any, limit = 10) {
    const companyId = user.companyId;
    const items = await this.prisma.purchaseOrderItem.findMany({
      where: { companyId, isActive: true },
      select: { itemCode: true, itemName: true, orderedQty: true, totalPrice: true, uom: true },
    });

    const itemMap: Record<string, any> = {};
    for (const item of items) {
      const key = item.itemCode;
      if (!itemMap[key]) {
        itemMap[key] = { itemCode: item.itemCode, itemName: item.itemName, uom: item.uom, totalQty: 0, totalSpend: 0, orderCount: 0 };
      }
      itemMap[key].totalQty += item.orderedQty;
      itemMap[key].totalSpend += item.totalPrice || 0;
      itemMap[key].orderCount += 1;
    }

    return Object.values(itemMap)
      .sort((a: any, b: any) => b.totalSpend - a.totalSpend)
      .slice(0, limit);
  }
}
