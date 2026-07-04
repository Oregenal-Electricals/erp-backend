import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private getPeriodDates(months = 1) {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { from, to, now };
  }

  private getMonthLabel(d: Date) {
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }

  async getExecutiveDashboard(companyId: string) {
    const { now } = this.getPeriodDates(1);
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Revenue MTD
    const [revMTD, revPrev, orderStats, poStats, ncrStats, arStats, apStats, approvalStats, taskStats, lowStock] = await Promise.all([
      this.prisma.arInvoice.aggregate({ where: { companyId, invoiceDate: { gte: mStart, lte: mEnd }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
      this.prisma.arInvoice.aggregate({ where: { companyId, invoiceDate: { gte: prevStart, lte: prevEnd }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
      this.prisma.salesOrder.groupBy({ by: ['status'], where: { companyId, isActive: true }, _count: { id: true } }),
      this.prisma.purchaseOrder.groupBy({ by: ['status'], where: { companyId, isActive: true }, _count: { id: true } }),
      this.prisma.ncrRecord.groupBy({ by: ['status'], where: { companyId, isActive: true }, _count: { id: true } }),
      this.prisma.arInvoice.aggregate({ where: { companyId, status: { in: ['SENT','PARTIAL','OVERDUE'] } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
      this.prisma.apBill.aggregate({ where: { companyId, status: { in: ['APPROVED','PARTIAL','OVERDUE'] } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
      this.prisma.approvalRequest.count({ where: { companyId, status: 'PENDING' } }),
      this.prisma.task.count({ where: { companyId, status: { in: ['OPEN','IN_PROGRESS'] }, isActive: true } }),
      this.prisma.stockBalance.count({ where: { companyId, availableQty: { lte: 10 } } }),
    ]);

    // Monthly revenue trend (6 months)
    const revTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const rev = await this.prisma.arInvoice.aggregate({
        where: { companyId, invoiceDate: { gte: d, lte: dEnd }, status: { notIn: ['CANCELLED'] } },
        _sum: { totalAmount: true },
      });
      revTrend.push({ month: this.getMonthLabel(d), revenue: rev._sum.totalAmount || 0 });
    }

    // Order pipeline
    const soByStatus: Record<string, number> = {};
    orderStats.forEach(s => { soByStatus[s.status] = s._count.id; });

    const poByStatus: Record<string, number> = {};
    poStats.forEach(s => { poByStatus[s.status] = s._count.id; });

    const ncrByStatus: Record<string, number> = {};
    ncrStats.forEach(s => { ncrByStatus[s.status] = s._count.id; });

    const revMTDVal = revMTD._sum.totalAmount || 0;
    const revPrevVal = revPrev._sum.totalAmount || 0;
    const revGrowth = revPrevVal > 0 ? Math.round((revMTDVal - revPrevVal) / revPrevVal * 100 * 10) / 10 : 0;

    // Top customers
    const topCustomers = await this.prisma.arInvoice.groupBy({
      by: ['customerName'],
      where: { companyId, status: { notIn: ['CANCELLED'] } },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    });

    // Recent activities
    const recentOrders = await this.prisma.salesOrder.findMany({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'desc' }, take: 5,
      select: { soNumber: true, customerName: true, totalAmount: true, status: true, createdAt: true },
    });

    return {
      kpis: {
        revenueMTD: revMTDVal, revenuePrev: revPrevVal, revenueGrowth: revGrowth,
        arOutstanding: arStats._sum.outstandingAmount || 0, arCount: arStats._count.id,
        apOutstanding: apStats._sum.outstandingAmount || 0, apCount: apStats._count.id,
        pendingApprovals: approvalStats, openTasks: taskStats, lowStockItems: lowStock,
      },
      orderPipeline: soByStatus,
      purchasePipeline: poByStatus,
      ncrSummary: ncrByStatus,
      revenueTrend: revTrend,
      topCustomers: topCustomers.map(c => ({ name: c.customerName, revenue: c._sum.totalAmount || 0 })),
      recentOrders,
    };
  }

  async getSalesAnalytics(companyId: string) {
    const now = new Date();

    // Monthly sales trend (12 months)
    const salesTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const [rev, orders] = await Promise.all([
        this.prisma.arInvoice.aggregate({ where: { companyId, invoiceDate: { gte: d, lte: dEnd }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
        this.prisma.salesOrder.count({ where: { companyId, createdAt: { gte: d, lte: dEnd } } }),
      ]);
      salesTrend.push({ month: this.getMonthLabel(d), revenue: rev._sum.totalAmount || 0, orders });
    }

    // Top customers
    const topCustomers = await this.prisma.arInvoice.groupBy({
      by: ['customerName'], where: { companyId, status: { notIn: ['CANCELLED'] } },
      _sum: { totalAmount: true }, _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } }, take: 10,
    });

    // Sales by status
    const soStatus = await this.prisma.salesOrder.groupBy({
      by: ['status'], where: { companyId, isActive: true }, _count: { id: true },
    });

    // Dispatch performance
    const dispatched = await this.prisma.dispatch.count({ where: { companyId, isActive: true } });
    const delivered = await this.prisma.dispatch.count({ where: { companyId, isActive: true, status: 'DELIVERED' } });

    return {
      salesTrend,
      topCustomers: topCustomers.map(c => ({ name: c.customerName, revenue: c._sum.totalAmount || 0, invoices: c._count.id })),
      soByStatus: soStatus.reduce((a, s) => ({ ...a, [s.status]: s._count.id }), {}),
      dispatchRate: dispatched > 0 ? Math.round(delivered / dispatched * 100) : 0,
      totalDispatched: dispatched, totalDelivered: delivered,
    };
  }

  async getPurchaseAnalytics(companyId: string) {
    const now = new Date();

    // Monthly purchase trend
    const purchaseTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const spend = await this.prisma.purchaseOrder.aggregate({
        where: { companyId, poDate: { gte: d, lte: dEnd }, status: { notIn: ['CANCELLED'] } },
        _sum: { totalAmount: true },
      });
      purchaseTrend.push({ month: this.getMonthLabel(d), spend: spend._sum.totalAmount || 0 });
    }

    // Top vendors by spend
    const topVendors = await this.prisma.purchaseOrder.groupBy({
      by: ['vendorId'], where: { companyId, status: { notIn: ['CANCELLED'] } },
      _sum: { totalAmount: true }, _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } }, take: 10,
    });

    const vendorIds = topVendors.map(v => v.vendorId);
    const vendors = await this.prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, name: true } });
    const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));

    // PO by status
    const poStatus = await this.prisma.purchaseOrder.groupBy({
      by: ['status'], where: { companyId, isActive: true }, _count: { id: true },
    });

    return {
      purchaseTrend,
      topVendors: topVendors.map(v => ({ name: vendorMap[v.vendorId] || v.vendorId, spend: v._sum.totalAmount || 0, pos: v._count.id })),
      poByStatus: poStatus.reduce((a, s) => ({ ...a, [s.status]: s._count.id }), {}),
    };
  }

  async getInventoryAnalytics(companyId: string) {
    // Stock summary
    const stockSummary = await this.prisma.stockBalance.aggregate({
      where: { companyId, isActive: true },
      _sum: { availableQty: true, totalValue: true },
      _count: { id: true },
    });

    // Low stock items
    const lowStock = await this.prisma.stockBalance.findMany({
      where: { companyId, availableQty: { lte: 10 }, isActive: true },
      include: { warehouse: { select: { name: true } } },
      orderBy: { availableQty: 'asc' }, take: 20,
    });

    // Stock by warehouse
    const byWarehouse = await this.prisma.stockBalance.groupBy({
      by: ['warehouseId'], where: { companyId, isActive: true },
      _sum: { totalValue: true, availableQty: true }, _count: { id: true },
    });

    const warehouseIds = byWarehouse.map(w => w.warehouseId);
    const warehouses = await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } }, select: { id: true, name: true } });
    const wMap = Object.fromEntries(warehouses.map(w => [w.id, w.name]));

    // Zero stock items
    const zeroStock = await this.prisma.stockBalance.count({ where: { companyId, availableQty: { lte: 0 } } });

    return {
      totalItems: stockSummary._count.id,
      totalQty: stockSummary._sum.availableQty || 0,
      totalValue: stockSummary._sum.totalValue || 0,
      lowStockCount: lowStock.length,
      zeroStockCount: zeroStock,
      lowStockItems: lowStock.map(s => ({ itemCode: s.itemCode, itemName: s.itemName, availableQty: s.availableQty, warehouse: (s as any).warehouse?.name || '—' })),
      byWarehouse: byWarehouse.map(w => ({ warehouse: wMap[w.warehouseId] || w.warehouseId, value: w._sum.totalValue || 0, qty: w._sum.availableQty || 0, items: w._count.id })),
    };
  }

  async getQualityAnalytics(companyId: string) {
    const now = new Date();

    // NCR trend (6 months)
    const ncrTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count = await this.prisma.ncrRecord.count({ where: { companyId, createdAt: { gte: d, lte: dEnd } } });
      ncrTrend.push({ month: this.getMonthLabel(d), ncrs: count });
    }

    // NCR by source
    const ncrBySource = await this.prisma.ncrRecord.groupBy({
      by: ['source'], where: { companyId, isActive: true }, _count: { id: true },
    });

    // NCR by severity
    const ncrBySeverity = await this.prisma.ncrRecord.groupBy({
      by: ['severity'], where: { companyId, isActive: true }, _count: { id: true },
    });

    // NCR by status
    const ncrByStatus = await this.prisma.ncrRecord.groupBy({
      by: ['status'], where: { companyId, isActive: true }, _count: { id: true },
    });

    // CAPA stats
    const [capaOpen, capaClosed, capaOverdue] = await Promise.all([
      this.prisma.capaRecord.count({ where: { companyId, status: { in: ['OPEN','IN_PROGRESS'] } } }),
      this.prisma.capaRecord.count({ where: { companyId, status: 'CLOSED' } }),
      this.prisma.capaRecord.count({ where: { companyId, status: { in: ['OPEN','IN_PROGRESS'] }, dueDate: { lt: now } } }),
    ]);

    return {
      ncrTrend,
      ncrBySource: ncrBySource.reduce((a, s) => ({ ...a, [s.source]: s._count.id }), {}),
      ncrBySeverity: ncrBySeverity.reduce((a, s) => ({ ...a, [s.severity]: s._count.id }), {}),
      ncrByStatus: ncrByStatus.reduce((a, s) => ({ ...a, [s.status]: s._count.id }), {}),
      capa: { open: capaOpen, closed: capaClosed, overdue: capaOverdue },
    };
  }

  async getFinanceAnalytics(companyId: string) {
    const now = new Date();

    // P&L trend (6 months)
    const plTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const [rev, spend] = await Promise.all([
        this.prisma.arInvoice.aggregate({ where: { companyId, invoiceDate: { gte: d, lte: dEnd }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
        this.prisma.apBill.aggregate({ where: { companyId, billDate: { gte: d, lte: dEnd }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
      ]);
      const revenue = rev._sum.totalAmount || 0;
      const expense = spend._sum.totalAmount || 0;
      plTrend.push({ month: this.getMonthLabel(d), revenue, expense, profit: revenue - expense });
    }

    // AR aging
    const arBuckets = await Promise.all([
      this.prisma.arInvoice.aggregate({ where: { companyId, status: { in: ['SENT','PARTIAL','OVERDUE'] }, dueDate: { gte: now } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
      this.prisma.arInvoice.aggregate({ where: { companyId, status: { in: ['SENT','PARTIAL','OVERDUE'] }, dueDate: { lt: now, gte: new Date(now.getTime() - 30*86400000) } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
      this.prisma.arInvoice.aggregate({ where: { companyId, status: { in: ['SENT','PARTIAL','OVERDUE'] }, dueDate: { lt: new Date(now.getTime() - 30*86400000), gte: new Date(now.getTime() - 60*86400000) } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
      this.prisma.arInvoice.aggregate({ where: { companyId, status: { in: ['SENT','PARTIAL','OVERDUE'] }, dueDate: { lt: new Date(now.getTime() - 60*86400000) } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
    ]);

    return {
      plTrend,
      arAging: [
        { bucket: 'Current', amount: arBuckets[0]._sum.outstandingAmount || 0, count: arBuckets[0]._count.id },
        { bucket: '1-30 days', amount: arBuckets[1]._sum.outstandingAmount || 0, count: arBuckets[1]._count.id },
        { bucket: '31-60 days', amount: arBuckets[2]._sum.outstandingAmount || 0, count: arBuckets[2]._count.id },
        { bucket: '60+ days', amount: arBuckets[3]._sum.outstandingAmount || 0, count: arBuckets[3]._count.id },
      ],
    };
  }

  async getSalesDeep(companyId: string, query: any) {
    const { period = '12' } = query;
    const months = parseInt(period) || 12;
    const now = new Date();

    // Monthly trend (12 months)
    const salesTrend = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [rev, orders] = await Promise.all([
        this.prisma.arInvoice.aggregate({ where: { companyId, invoiceDate: { gte: from, lte: to }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
        this.prisma.salesOrder.count({ where: { companyId, createdAt: { gte: from, lte: to } } }),
      ]);
      salesTrend.push({ month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), revenue: rev._sum.totalAmount || 0, orders });
    }

    // Order funnel
    const [leads, quotes, cpos, sos, dispatches, deliveries] = await Promise.all([
      this.prisma.lead.count({ where: { companyId } }),
      this.prisma.quotation.count({ where: { companyId } }),
      this.prisma.customerPo.count({ where: { companyId } }),
      this.prisma.salesOrder.count({ where: { companyId } }),
      this.prisma.dispatch.count({ where: { companyId } }),
      this.prisma.dispatch.count({ where: { companyId, status: 'DELIVERED' } }),
    ]);

    // Top customers (by revenue)
    const topCustomers = await this.prisma.arInvoice.groupBy({
      by: ['customerName'], where: { companyId, status: { notIn: ['CANCELLED'] } },
      _sum: { totalAmount: true, outstandingAmount: true }, _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } }, take: 10,
    });

    // AR aging
    const invoices = await this.prisma.arInvoice.findMany({
      where: { companyId, status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } },
      select: { dueDate: true, outstandingAmount: true, customerName: true },
    });
    const aging = { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0 };
    invoices.forEach(inv => {
      const days = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
      if (days <= 0) aging.current += inv.outstandingAmount;
      else if (days <= 30) aging.days1_30 += inv.outstandingAmount;
      else if (days <= 60) aging.days31_60 += inv.outstandingAmount;
      else if (days <= 90) aging.days61_90 += inv.outstandingAmount;
      else aging.over90 += inv.outstandingAmount;
    });

    // KPIs
    const [totalRevenue, totalOrders, totalCollected] = await Promise.all([
      this.prisma.arInvoice.aggregate({ where: { companyId, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
      this.prisma.salesOrder.count({ where: { companyId } }),
      this.prisma.arInvoice.aggregate({ where: { companyId, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true, outstandingAmount: true } }),
    ]);
    const collected = (totalCollected._sum.totalAmount || 0) - (totalCollected._sum.outstandingAmount || 0);
    const collectionRate = totalCollected._sum.totalAmount > 0 ? Math.round(collected / totalCollected._sum.totalAmount * 100) : 0;

    return {
      kpis: {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue._sum.totalAmount || 0) / totalOrders) : 0,
        collectionRate,
        dispatchRate: sos > 0 ? Math.round(dispatches / sos * 100) : 0,
      },
      salesTrend,
      funnel: { leads, quotes, cpos, sos, dispatches, deliveries },
      topCustomers: topCustomers.map(c => ({ name: c.customerName, revenue: c._sum.totalAmount || 0, outstanding: c._sum.outstandingAmount || 0, invoices: c._count.id })),
      aging,
      soByStatus: await this.prisma.salesOrder.groupBy({ by: ['status'], where: { companyId }, _count: { id: true } }).then(r => Object.fromEntries(r.map(x => [x.status, x._count.id]))),
    };
  }


  async getPurchaseDeep(companyId: string, query: any) {
    const { period = '12' } = query;
    const months = parseInt(period) || 12;
    const now = new Date();

    // Monthly spend trend
    const purchaseTrend = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [spend, pos] = await Promise.all([
        this.prisma.apBill.aggregate({ where: { companyId, billDate: { gte: from, lte: to }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
        this.prisma.purchaseOrder.count({ where: { companyId, poDate: { gte: from, lte: to } } }),
      ]);
      purchaseTrend.push({ month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), spend: spend._sum.totalAmount || 0, pos });
    }

    // Top vendors by spend
    const topVendors = await this.prisma.purchaseOrder.groupBy({
      by: ['vendorId'], where: { companyId, status: { notIn: ['CANCELLED'] } },
      _sum: { totalAmount: true }, _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } }, take: 10,
    });
    const vendorIds = topVendors.map(v => v.vendorId);
    const vendors = await this.prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, name: true, code: true } });
    const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v]));

    // AP Aging
    const bills = await this.prisma.apBill.findMany({
      where: { companyId, status: { in: ['APPROVED', 'PARTIAL', 'OVERDUE'] } },
      select: { dueDate: true, outstandingAmount: true },
    });
    const apAging = { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0 };
    bills.forEach(b => {
      const days = Math.floor((now.getTime() - new Date(b.dueDate).getTime()) / 86400000);
      if (days <= 0) apAging.current += b.outstandingAmount;
      else if (days <= 30) apAging.days1_30 += b.outstandingAmount;
      else if (days <= 60) apAging.days31_60 += b.outstandingAmount;
      else if (days <= 90) apAging.days61_90 += b.outstandingAmount;
      else apAging.over90 += b.outstandingAmount;
    });

    // KPIs
    const [totalSpend, totalPos, apData] = await Promise.all([
      this.prisma.apBill.aggregate({ where: { companyId, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
      this.prisma.purchaseOrder.count({ where: { companyId } }),
      this.prisma.apBill.aggregate({ where: { companyId, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true, outstandingAmount: true } }),
    ]);
    const paid = (apData._sum.totalAmount || 0) - (apData._sum.outstandingAmount || 0);
    const paymentRate = apData._sum.totalAmount > 0 ? Math.round(paid / apData._sum.totalAmount * 100) : 0;

    // PO pipeline
    const poByStatus = await this.prisma.purchaseOrder.groupBy({
      by: ['status'], where: { companyId }, _count: { id: true },
    }).then(r => Object.fromEntries(r.map(x => [x.status, x._count.id])));

    // GRN stats
    const [totalGrns, pendingGrns] = await Promise.all([
      this.prisma.grnHeader.count({ where: { companyId } }),
      this.prisma.grnHeader.count({ where: { companyId, status: 'PENDING' } }),
    ]);

    return {
      kpis: {
        totalSpend: totalSpend._sum.totalAmount || 0,
        totalPos,
        avgPoValue: totalPos > 0 ? Math.round((totalSpend._sum.totalAmount || 0) / totalPos) : 0,
        paymentRate,
        apOutstanding: apData._sum.outstandingAmount || 0,
        totalGrns,
        pendingGrns,
      },
      purchaseTrend,
      topVendors: topVendors.map(v => ({ name: vendorMap[v.vendorId]?.name || v.vendorId, code: vendorMap[v.vendorId]?.code || '', spend: v._sum.totalAmount || 0, pos: v._count.id })),
      poByStatus,
      apAging,
    };
  }


  async getInventoryDeep(companyId: string) {
    const now = new Date();

    // Stock balance summary
    const stocks = await this.prisma.stockBalance.findMany({
      where: { companyId, isActive: true },
      include: { warehouse: { select: { name: true } } },
      orderBy: { totalValue: 'desc' },
    });

    const totalItems = stocks.length;
    const totalValue = stocks.reduce((s, i) => s + i.totalValue, 0);
    const totalQty = stocks.reduce((s, i) => s + i.availableQty, 0);

    // Low stock (availableQty < 10)
    const lowStock = stocks.filter(s => s.availableQty > 0 && s.availableQty < 10);
    const zeroStock = stocks.filter(s => s.availableQty === 0);

    // Top items by value
    const topByValue = stocks.slice(0, 10).map(s => ({
      itemCode: s.itemCode, itemName: s.itemName,
      warehouse: (s as any).warehouse?.name || '—',
      availableQty: s.availableQty, unitCost: s.unitCost, totalValue: s.totalValue,
    }));

    // By warehouse
    const warehouseMap: Record<string, { name: string; value: number; qty: number; items: number }> = {};
    stocks.forEach(s => {
      const wName = (s as any).warehouse?.name || 'Unknown';
      if (!warehouseMap[wName]) warehouseMap[wName] = { name: wName, value: 0, qty: 0, items: 0 };
      warehouseMap[wName].value += s.totalValue;
      warehouseMap[wName].qty += s.availableQty;
      warehouseMap[wName].items += 1;
    });

    // Stock movement trend (last 12 months via stock ledger)
    const movementTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [inQty, outQty] = await Promise.all([
        this.prisma.stockLedger.aggregate({ where: { companyId, transactionDate: { gte: from, lte: to }, transactionType: { in: ['GRN','PRODUCTION_IN','TRANSFER_IN'] } }, _sum: { inQty: true } }),
        this.prisma.stockLedger.aggregate({ where: { companyId, transactionDate: { gte: from, lte: to }, transactionType: { in: ['DISPATCH','ISSUE','TRANSFER_OUT'] } }, _sum: { outQty: true } }),
      ]);
      movementTrend.push({ month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), inQty: inQty._sum.inQty || 0, outQty: Math.abs(outQty._sum.outQty || 0) });
    }

    return {
      kpis: { totalItems, totalValue, totalQty, lowStockCount: lowStock.length, zeroStockCount: zeroStock.length },
      topByValue,
      byWarehouse: Object.values(warehouseMap),
      lowStockItems: lowStock.map(s => ({ itemCode: s.itemCode, itemName: s.itemName, availableQty: s.availableQty, warehouse: (s as any).warehouse?.name || '—', unitCost: s.unitCost })),
      zeroStockItems: zeroStock.slice(0, 10).map(s => ({ itemCode: s.itemCode, itemName: s.itemName, warehouse: (s as any).warehouse?.name || '—' })),
      movementTrend,
    };
  }


  async getProductionDeep(companyId: string) {
    const now = new Date();

    // KPIs
    const [total, completed, inProgress, cancelled, draft] = await Promise.all([
      this.prisma.workOrder.count({ where: { companyId } }),
      this.prisma.workOrder.count({ where: { companyId, status: 'COMPLETED' } }),
      this.prisma.workOrder.count({ where: { companyId, status: 'IN_PROGRESS' } }),
      this.prisma.workOrder.count({ where: { companyId, status: 'CANCELLED' } }),
      this.prisma.workOrder.count({ where: { companyId, status: { in: ['DRAFT','RELEASED'] } } }),
    ]);

    // Production quantities
    const qtyData = await this.prisma.workOrder.aggregate({
      where: { companyId },
      _sum: { plannedQty: true, completedQty: true, rejectedQty: true },
    });

    const totalPlanned = qtyData._sum.plannedQty || 0;
    const totalCompleted = qtyData._sum.completedQty || 0;
    const totalRejected = qtyData._sum.rejectedQty || 0;
    const completionRate = totalPlanned > 0 ? Math.round(totalCompleted / totalPlanned * 100) : 0;
    const rejectionRate = totalCompleted > 0 ? Math.round(totalRejected / (totalCompleted + totalRejected) * 100 * 100) / 100 : 0;

    // Monthly production trend (12 months)
    const productionTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [wos, qty] = await Promise.all([
        this.prisma.workOrder.count({ where: { companyId, createdAt: { gte: from, lte: to } } }),
        this.prisma.workOrder.aggregate({ where: { companyId, status: 'COMPLETED', actualEndDate: { gte: from, lte: to } }, _sum: { completedQty: true } }),
      ]);
      productionTrend.push({ month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), wos, completedQty: qty._sum.completedQty || 0 });
    }

    // WO by status
    const woByStatus = await this.prisma.workOrder.groupBy({
      by: ['status'], where: { companyId }, _count: { id: true },
    }).then(r => Object.fromEntries(r.map(x => [x.status, x._count.id])));

    // Top products by production volume
    const topProducts = await this.prisma.workOrder.groupBy({
      by: ['productCode', 'productName'], where: { companyId, status: 'COMPLETED' },
      _sum: { completedQty: true }, _count: { id: true },
      orderBy: { _sum: { completedQty: 'desc' } }, take: 10,
    });

    // Overdue WOs
    const overdueWos = await this.prisma.workOrder.findMany({
      where: { companyId, status: { in: ['RELEASED','IN_PROGRESS'] }, plannedEndDate: { lt: now } },
      select: { woNumber: true, productName: true, plannedEndDate: true, status: true, priority: true, plannedQty: true, completedQty: true },
      orderBy: { plannedEndDate: 'asc' }, take: 10,
    });

    // Avg cycle time for completed WOs
    const completedWos = await this.prisma.workOrder.findMany({
      where: { companyId, status: 'COMPLETED', actualStartDate: { not: null }, actualEndDate: { not: null } },
      select: { actualStartDate: true, actualEndDate: true },
      take: 100,
    });
    const avgCycleHours = completedWos.length > 0
      ? Math.round(completedWos.reduce((s, wo) => s + (new Date(wo.actualEndDate).getTime() - new Date(wo.actualStartDate).getTime()) / 3600000, 0) / completedWos.length * 10) / 10
      : 0;

    return {
      kpis: { total, completed, inProgress, cancelled, draft, completionRate, rejectionRate, avgCycleHours, totalPlanned, totalCompleted, totalRejected },
      productionTrend,
      woByStatus,
      topProducts: topProducts.map(p => ({ productCode: p.productCode, productName: p.productName, completedQty: p._sum.completedQty || 0, wos: p._count.id })),
      overdueWos,
    };
  }


  async getQualityDeep(companyId: string) {
    const now = new Date();

    // NCR KPIs
    const [ncrTotal, ncrOpen, ncrClosed, ncrCritical] = await Promise.all([
      this.prisma.ncrRecord.count({ where: { companyId } }),
      this.prisma.ncrRecord.count({ where: { companyId, status: { in: ['OPEN','UNDER_REVIEW','CAPA_PENDING'] } } }),
      this.prisma.ncrRecord.count({ where: { companyId, status: 'CLOSED' } }),
      this.prisma.ncrRecord.count({ where: { companyId, severity: 'CRITICAL' } }),
    ]);

    // CAPA KPIs
    const [capaTotal, capaCompleted, capaOverdue] = await Promise.all([
      this.prisma.capaRecord.count({ where: { companyId } }),
      this.prisma.capaRecord.count({ where: { companyId, status: { in: ['COMPLETED','VERIFIED'] } } }),
      this.prisma.capaRecord.count({ where: { companyId, status: { notIn: ['COMPLETED','VERIFIED'] }, dueDate: { lt: now } } }),
    ]);

    const capaCompletionRate = capaTotal > 0 ? Math.round(capaCompleted / capaTotal * 100) : 0;

    // NCR 12-month trend
    const ncrTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = await this.prisma.ncrRecord.count({ where: { companyId, detectedDate: { gte: from, lte: to } } });
      ncrTrend.push({ month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), ncrs: count });
    }

    // NCR by source, severity, status
    const [bySource, bySeverity, byStatus] = await Promise.all([
      this.prisma.ncrRecord.groupBy({ by: ['source'], where: { companyId }, _count: { id: true } }).then(r => Object.fromEntries(r.map(x => [x.source, x._count.id]))),
      this.prisma.ncrRecord.groupBy({ by: ['severity'], where: { companyId }, _count: { id: true } }).then(r => Object.fromEntries(r.map(x => [x.severity, x._count.id]))),
      this.prisma.ncrRecord.groupBy({ by: ['status'], where: { companyId }, _count: { id: true } }).then(r => Object.fromEntries(r.map(x => [x.status, x._count.id]))),
    ]);

    // Top defect items
    const topDefectItems = await this.prisma.ncrRecord.groupBy({
      by: ['itemName'], where: { companyId, itemName: { not: null } },
      _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 8,
    });

    // CAPA by status
    const capaByStatus = await this.prisma.capaRecord.groupBy({
      by: ['status'], where: { companyId }, _count: { id: true },
    }).then(r => Object.fromEntries(r.map(x => [x.status, x._count.id])));

    // OQC stats
    const [oqcTotal, oqcPassed, oqcFailed] = await Promise.all([
      this.prisma.oqcInspection.count({ where: { companyId } }),
      this.prisma.oqcInspection.count({ where: { companyId, result: 'PASS' } }),
      this.prisma.oqcInspection.count({ where: { companyId, result: 'FAIL' } }),
    ]);
    const oqcPassRate = oqcTotal > 0 ? Math.round(oqcPassed / oqcTotal * 100) : 0;

    // Quality score (composite: low NCR rate + high CAPA completion + high OQC pass)
    const qualityScore = Math.round((capaCompletionRate * 0.4 + oqcPassRate * 0.4 + (ncrTotal > 0 ? Math.max(0, 100 - ncrCritical / ncrTotal * 100) : 100) * 0.2));

    return {
      kpis: { ncrTotal, ncrOpen, ncrClosed, ncrCritical, capaTotal, capaCompleted, capaOverdue, capaCompletionRate, oqcTotal, oqcPassed, oqcFailed, oqcPassRate, qualityScore },
      ncrTrend,
      bySource,
      bySeverity,
      byStatus,
      capaByStatus,
      topDefectItems: topDefectItems.map(i => ({ itemName: i.itemName || 'Unknown', count: i._count.id })),
    };
  }


  async getFinanceDeep(companyId: string) {
    const now = new Date();

    // P&L 12-month trend
    const plTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [rev, exp] = await Promise.all([
        this.prisma.arInvoice.aggregate({ where: { companyId, invoiceDate: { gte: from, lte: to }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
        this.prisma.apBill.aggregate({ where: { companyId, billDate: { gte: from, lte: to }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
      ]);
      const revenue = rev._sum.totalAmount || 0;
      const expense = exp._sum.totalAmount || 0;
      plTrend.push({ month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), revenue, expense, profit: revenue - expense });
    }

    // KPIs
    const [totalRevenue, totalExpense, arOutstanding, apOutstanding, bankBalance] = await Promise.all([
      this.prisma.arInvoice.aggregate({ where: { companyId, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
      this.prisma.apBill.aggregate({ where: { companyId, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
      this.prisma.arInvoice.aggregate({ where: { companyId, status: { in: ['SENT','PARTIAL','OVERDUE'] } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
      this.prisma.apBill.aggregate({ where: { companyId, status: { in: ['APPROVED','PARTIAL','OVERDUE'] } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
      this.prisma.account.aggregate({ where: { companyId, accountSubType: 'BANK', isActive: true }, _sum: { currentBalance: true } }),
    ]);

    const revenue = totalRevenue._sum.totalAmount || 0;
    const expense = totalExpense._sum.totalAmount || 0;
    const grossProfit = revenue - expense;
    const profitMargin = revenue > 0 ? Math.round(grossProfit / revenue * 100 * 100) / 100 : 0;

    // AR Aging
    const arInvoices = await this.prisma.arInvoice.findMany({
      where: { companyId, status: { in: ['SENT','PARTIAL','OVERDUE'] } },
      select: { dueDate: true, outstandingAmount: true },
    });
    const arAging = { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0 };
    arInvoices.forEach(inv => {
      const days = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
      if (days <= 0) arAging.current += inv.outstandingAmount;
      else if (days <= 30) arAging.days1_30 += inv.outstandingAmount;
      else if (days <= 60) arAging.days31_60 += inv.outstandingAmount;
      else if (days <= 90) arAging.days61_90 += inv.outstandingAmount;
      else arAging.over90 += inv.outstandingAmount;
    });

    // AP Aging
    const apBills = await this.prisma.apBill.findMany({
      where: { companyId, status: { in: ['APPROVED','PARTIAL','OVERDUE'] } },
      select: { dueDate: true, outstandingAmount: true },
    });
    const apAging = { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0 };
    apBills.forEach(b => {
      const days = Math.floor((now.getTime() - new Date(b.dueDate).getTime()) / 86400000);
      if (days <= 0) apAging.current += b.outstandingAmount;
      else if (days <= 30) apAging.days1_30 += b.outstandingAmount;
      else if (days <= 60) apAging.days31_60 += b.outstandingAmount;
      else if (days <= 90) apAging.days61_90 += b.outstandingAmount;
      else apAging.over90 += b.outstandingAmount;
    });

    // GST summary current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [outputGst, inputGst] = await Promise.all([
      this.prisma.arInvoice.aggregate({ where: { companyId, invoiceDate: { gte: monthStart }, status: { notIn: ['CANCELLED'] } }, _sum: { totalGst: true } }),
      this.prisma.apBill.aggregate({ where: { companyId, billDate: { gte: monthStart }, status: { notIn: ['CANCELLED'] } }, _sum: { totalGst: true } }),
    ]);
    const outputGstAmt = outputGst._sum.totalGst || 0;
    const inputGstAmt = inputGst._sum.totalGst || 0;

    // Voucher stats
    const [totalVouchers, postedVouchers] = await Promise.all([
      this.prisma.voucher.count({ where: { companyId } }),
      this.prisma.voucher.count({ where: { companyId, status: 'POSTED' } }),
    ]);

    return {
      kpis: {
        totalRevenue: revenue, totalExpense: expense, grossProfit, profitMargin,
        arOutstanding: arOutstanding._sum.outstandingAmount || 0, arCount: arOutstanding._count.id,
        apOutstanding: apOutstanding._sum.outstandingAmount || 0, apCount: apOutstanding._count.id,
        bankBalance: bankBalance._sum.currentBalance || 0,
        outputGst: outputGstAmt, inputGst: inputGstAmt, netGst: Math.max(0, outputGstAmt - inputGstAmt),
        totalVouchers, postedVouchers,
      },
      plTrend,
      arAging,
      apAging,
    };
  }

}