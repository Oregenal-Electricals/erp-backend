import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MisReportsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(period: string, fromDate?: string, toDate?: string) {
    const now = new Date();
    if (fromDate && toDate) return { from: new Date(fromDate), to: new Date(toDate) };
    const months = parseInt(period) || 1;
    return { from: new Date(now.getFullYear(), now.getMonth() - months + 1, 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) };
  }

  async getSalesSummary(companyId: string, query: any) {
    const { from, to } = this.getDateRange(query.period, query.fromDate, query.toDate);
    const [sos, invoices, dispatches] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where: { companyId, createdAt: { gte: from, lte: to } },
        select: { soNumber: true, customerName: true, totalAmount: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.arInvoice.findMany({
        where: { companyId, invoiceDate: { gte: from, lte: to }, status: { notIn: ['CANCELLED'] } },
        select: { invoiceNumber: true, customerName: true, subtotal: true, totalGst: true, totalAmount: true, outstandingAmount: true, status: true, invoiceDate: true },
        orderBy: { invoiceDate: 'desc' },
      }),
      this.prisma.dispatch.count({ where: { companyId, dispatchDate: { gte: from, lte: to } } }),
    ]);
    const totalRevenue = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalOutstanding = invoices.reduce((s, i) => s + i.outstandingAmount, 0);
    return { reportType: 'SALES_SUMMARY', period: { from, to }, summary: { totalOrders: sos.length, totalInvoices: invoices.length, totalRevenue, totalOutstanding, totalDispatches: dispatches }, salesOrders: sos, invoices };
  }

  async getPurchaseSummary(companyId: string, query: any) {
    const { from, to } = this.getDateRange(query.period, query.fromDate, query.toDate);
    const [pos, bills, grns] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { companyId, poDate: { gte: from, lte: to } },
        select: { poNumber: true, vendor: { select: { name: true } }, totalAmount: true, status: true, poDate: true, deliveryDate: true },
        orderBy: { poDate: 'desc' },
      }),
      this.prisma.apBill.findMany({
        where: { companyId, billDate: { gte: from, lte: to }, status: { notIn: ['CANCELLED'] } },
        select: { billNumber: true, vendorName: true, subtotal: true, totalGst: true, totalAmount: true, outstandingAmount: true, status: true, billDate: true },
        orderBy: { billDate: 'desc' },
      }),
      this.prisma.grnHeader.count({ where: { companyId, receivedDate: { gte: from, lte: to } } }),
    ]);
    const totalSpend = bills.reduce((s, b) => s + b.totalAmount, 0);
    const totalOutstanding = bills.reduce((s, b) => s + b.outstandingAmount, 0);
    return { reportType: 'PURCHASE_SUMMARY', period: { from, to }, summary: { totalPos: pos.length, totalBills: bills.length, totalSpend, totalOutstanding, totalGrns: grns }, purchaseOrders: pos.map(p => ({ ...p, vendorName: p.vendor?.name })), bills };
  }

  async getStockPosition(companyId: string, query: any) {
    const { warehouseId } = query;
    const where: any = { companyId, isActive: true };
    if (warehouseId) where.warehouseId = warehouseId;
    const stocks = await this.prisma.stockBalance.findMany({
      where, include: { warehouse: { select: { name: true, code: true } } },
      orderBy: [{ warehouseId: 'asc' }, { totalValue: 'desc' }],
    });
    const totalValue = stocks.reduce((s, i) => s + i.totalValue, 0);
    const totalQty = stocks.reduce((s, i) => s + i.availableQty, 0);
    const lowStock = stocks.filter(s => s.availableQty > 0 && s.availableQty < 10).length;
    const zeroStock = stocks.filter(s => s.availableQty === 0).length;
    return { reportType: 'STOCK_POSITION', asOf: new Date(), summary: { totalItems: stocks.length, totalValue, totalQty, lowStock, zeroStock }, items: stocks.map(s => ({ itemCode: s.itemCode, itemName: s.itemName, warehouse: (s as any).warehouse?.name, availableQty: s.availableQty, reservedQty: s.reservedQty, unitCost: s.unitCost, totalValue: s.totalValue })) };
  }

  async getOutstandingAr(companyId: string, query: any) {
    const { customerName } = query;
    const where: any = { companyId, status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } };
    if (customerName) where.customerName = { contains: customerName, mode: 'insensitive' };
    const invoices = await this.prisma.arInvoice.findMany({
      where, select: { invoiceNumber: true, customerName: true, invoiceDate: true, dueDate: true, totalAmount: true, outstandingAmount: true, status: true },
      orderBy: { dueDate: 'asc' },
    });
    const now = new Date();
    const items = invoices.map(inv => {
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000));
      return { ...inv, daysOverdue, isOverdue: daysOverdue > 0 };
    });
    const total = items.reduce((s, i) => s + i.outstandingAmount, 0);
    const overdue = items.filter(i => i.isOverdue).reduce((s, i) => s + i.outstandingAmount, 0);
    return { reportType: 'OUTSTANDING_AR', asOf: now, summary: { totalInvoices: items.length, totalOutstanding: total, overdueAmount: overdue, overdueCount: items.filter(i => i.isOverdue).length }, items };
  }

  async getOutstandingAp(companyId: string, query: any) {
    const { vendorName } = query;
    const where: any = { companyId, status: { in: ['APPROVED', 'PARTIAL', 'OVERDUE'] } };
    if (vendorName) where.vendorName = { contains: vendorName, mode: 'insensitive' };
    const bills = await this.prisma.apBill.findMany({
      where, select: { billNumber: true, vendorName: true, billDate: true, dueDate: true, totalAmount: true, outstandingAmount: true, status: true },
      orderBy: { dueDate: 'asc' },
    });
    const now = new Date();
    const items = bills.map(b => {
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(b.dueDate).getTime()) / 86400000));
      return { ...b, daysOverdue, isOverdue: daysOverdue > 0 };
    });
    const total = items.reduce((s, i) => s + i.outstandingAmount, 0);
    return { reportType: 'OUTSTANDING_AP', asOf: now, summary: { totalBills: items.length, totalOutstanding: total, overdueCount: items.filter(i => i.isOverdue).length }, items };
  }

  async getNcrSummary(companyId: string, query: any) {
    const { from, to } = this.getDateRange(query.period, query.fromDate, query.toDate);
    const ncrs = await this.prisma.ncrRecord.findMany({
      where: { companyId, detectedDate: { gte: from, lte: to } },
      select: { ncrNumber: true, source: true, severity: true, status: true, itemCode: true, itemName: true, detectedDate: true, description: true },
      orderBy: { detectedDate: 'desc' },
    });
    const bySeverity = ncrs.reduce((acc, n) => { acc[n.severity] = (acc[n.severity] || 0) + 1; return acc; }, {});
    const byStatus = ncrs.reduce((acc, n) => { acc[n.status] = (acc[n.status] || 0) + 1; return acc; }, {});
    return { reportType: 'NCR_SUMMARY', period: { from, to }, summary: { total: ncrs.length, bySeverity, byStatus }, items: ncrs };
  }

  async getProductionSummary(companyId: string, query: any) {
    const { from, to } = this.getDateRange(query.period, query.fromDate, query.toDate);
    const wos = await this.prisma.workOrder.findMany({
      where: { companyId, createdAt: { gte: from, lte: to } },
      select: { woNumber: true, productCode: true, productName: true, plannedQty: true, completedQty: true, rejectedQty: true, status: true, plannedStartDate: true, plannedEndDate: true, actualStartDate: true, actualEndDate: true },
      orderBy: { createdAt: 'desc' },
    });
    const totalPlanned = wos.reduce((s, w) => s + w.plannedQty, 0);
    const totalCompleted = wos.reduce((s, w) => s + w.completedQty, 0);
    const totalRejected = wos.reduce((s, w) => s + w.rejectedQty, 0);
    const byStatus = wos.reduce((acc, w) => { acc[w.status] = (acc[w.status] || 0) + 1; return acc; }, {});
    return { reportType: 'PRODUCTION_SUMMARY', period: { from, to }, summary: { totalWos: wos.length, totalPlanned, totalCompleted, totalRejected, completionRate: totalPlanned > 0 ? Math.round(totalCompleted / totalPlanned * 100) : 0, byStatus }, items: wos };
  }

  async getGstSummary(companyId: string, query: any) {
    const { from, to } = this.getDateRange(query.period, query.fromDate, query.toDate);
    const [arData, apData] = await Promise.all([
      this.prisma.arInvoice.findMany({ where: { companyId, invoiceDate: { gte: from, lte: to }, status: { notIn: ['CANCELLED'] } }, select: { invoiceNumber: true, customerName: true, subtotal: true, totalGst: true, invoiceDate: true } }),
      this.prisma.apBill.findMany({ where: { companyId, billDate: { gte: from, lte: to }, status: { notIn: ['CANCELLED'] } }, select: { billNumber: true, vendorName: true, subtotal: true, totalGst: true, billDate: true } }),
    ]);
    const outputGst = arData.reduce((s, i) => s + i.totalGst, 0);
    const inputGst = apData.reduce((s, b) => s + b.totalGst, 0);
    const netGst = outputGst - inputGst;
    return { reportType: 'GST_SUMMARY', period: { from, to }, summary: { outputGst, inputGst, netGst, netPayable: Math.max(0, netGst), excessCredit: Math.max(0, -netGst), salesCount: arData.length, purchaseCount: apData.length }, salesData: arData, purchaseData: apData };
  }
}
