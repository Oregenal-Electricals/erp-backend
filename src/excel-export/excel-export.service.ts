import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelExportService {
  constructor(private prisma: PrismaService) {}

  private createWorkbook(sheetName: string): { workbook: ExcelJS.Workbook; sheet: ExcelJS.Worksheet } {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Acme Electronics ERP';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    return { workbook, sheet };
  }

  private styleHeader(sheet: ExcelJS.Worksheet, cols: { header: string; key: string; width: number }[]) {
    sheet.columns = cols;
    const headerRow = sheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
    });
    headerRow.height = 22;
  }

  private styleDataRows(sheet: ExcelJS.Worksheet) {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell(cell => {
        cell.font = { size: 9 };
        cell.alignment = { vertical: 'middle' };
      });
      if (rowNumber % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        });
      }
      row.height = 18;
    });
  }

  private addSummaryRow(sheet: ExcelJS.Worksheet, label: string, values: (string | number)[]) {
    const row = sheet.addRow([label, ...values]);
    row.eachCell(cell => {
      cell.font = { bold: true, size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    });
  }

  private fmtDate(d: any) {
    return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  }

  private fmt(n: any) { return Number(n || 0).toFixed(2); }

  async exportArInvoices(companyId: string, query: any): Promise<any> {
    const { status, fromDate, toDate } = query;
    const where: any = { companyId, isActive: true };
    if (status) where.status = status;
    if (fromDate) where.invoiceDate = { gte: new Date(fromDate) };
    if (toDate) where.invoiceDate = { ...where.invoiceDate, lte: new Date(toDate) };

    const invoices = await this.prisma.arInvoice.findMany({ where, orderBy: { invoiceDate: 'desc' } });

    const { workbook, sheet } = this.createWorkbook('AR Invoices');
    this.styleHeader(sheet, [
      { header: 'Invoice No', key: 'invoiceNumber', width: 18 },
      { header: 'Customer', key: 'customerName', width: 30 },
      { header: 'Invoice Date', key: 'invoiceDate', width: 14 },
      { header: 'Due Date', key: 'dueDate', width: 14 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'GST', key: 'totalGst', width: 12 },
      { header: 'Total Amount', key: 'totalAmount', width: 16 },
      { header: 'Outstanding', key: 'outstandingAmount', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
    ]);

    invoices.forEach(inv => {
      sheet.addRow({
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        invoiceDate: this.fmtDate(inv.invoiceDate),
        dueDate: this.fmtDate(inv.dueDate),
        subtotal: this.fmt(inv.subtotal),
        totalGst: this.fmt(inv.totalGst),
        totalAmount: this.fmt(inv.totalAmount),
        outstandingAmount: this.fmt(inv.outstandingAmount),
        status: inv.status,
      });
    });

    const total = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const outstanding = invoices.reduce((s, i) => s + i.outstandingAmount, 0);
    this.addSummaryRow(sheet, `TOTAL (${invoices.length} invoices)`, ['','','','','', this.fmt(total), this.fmt(outstanding), '']);
    this.styleDataRows(sheet);

    return workbook.xlsx.writeBuffer() as Promise<any>;
  }

  async exportApBills(companyId: string, query: any): Promise<any> {
    const { status } = query;
    const where: any = { companyId, isActive: true };
    if (status) where.status = status;

    const bills = await this.prisma.apBill.findMany({ where, orderBy: { billDate: 'desc' } });

    const { workbook, sheet } = this.createWorkbook('AP Bills');
    this.styleHeader(sheet, [
      { header: 'Bill No', key: 'billNumber', width: 18 },
      { header: 'Vendor', key: 'vendorName', width: 30 },
      { header: 'Bill Date', key: 'billDate', width: 14 },
      { header: 'Due Date', key: 'dueDate', width: 14 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'GST', key: 'totalGst', width: 12 },
      { header: 'Total Amount', key: 'totalAmount', width: 16 },
      { header: 'Outstanding', key: 'outstandingAmount', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
    ]);

    bills.forEach(bill => {
      sheet.addRow({
        billNumber: bill.billNumber,
        vendorName: bill.vendorName,
        billDate: this.fmtDate(bill.billDate),
        dueDate: this.fmtDate(bill.dueDate),
        subtotal: this.fmt(bill.subtotal),
        totalGst: this.fmt(bill.totalGst),
        totalAmount: this.fmt(bill.totalAmount),
        outstandingAmount: this.fmt(bill.outstandingAmount),
        status: bill.status,
      });
    });

    this.addSummaryRow(sheet, `TOTAL (${bills.length} bills)`, ['','','','','',
      this.fmt(bills.reduce((s,b)=>s+b.totalAmount,0)),
      this.fmt(bills.reduce((s,b)=>s+b.outstandingAmount,0)), '']);
    this.styleDataRows(sheet);

    return workbook.xlsx.writeBuffer() as Promise<any>;
  }

  async exportPurchaseOrders(companyId: string, query: any): Promise<any> {
    const { status } = query;
    const where: any = { companyId, isActive: true };
    if (status) where.status = status;

    const pos = await this.prisma.purchaseOrder.findMany({
      where, orderBy: { poDate: 'desc' },
      include: { vendor: { select: { name: true, code: true } }, _count: { select: { items: true } } },
    });

    const { workbook, sheet } = this.createWorkbook('Purchase Orders');
    this.styleHeader(sheet, [
      { header: 'PO Number', key: 'poNumber', width: 18 },
      { header: 'Vendor', key: 'vendor', width: 30 },
      { header: 'Vendor Code', key: 'vendorCode', width: 14 },
      { header: 'PO Date', key: 'poDate', width: 14 },
      { header: 'Delivery Date', key: 'deliveryDate', width: 14 },
      { header: 'Items', key: 'items', width: 8 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'Total Tax', key: 'totalTax', width: 12 },
      { header: 'Total Amount', key: 'totalAmount', width: 16 },
      { header: 'Status', key: 'status', width: 16 },
    ]);

    pos.forEach(po => {
      sheet.addRow({
        poNumber: po.poNumber,
        vendor: po.vendor?.name || '—',
        vendorCode: po.vendor?.code || '—',
        poDate: this.fmtDate(po.poDate),
        deliveryDate: this.fmtDate(po.deliveryDate),
        items: po._count?.items || 0,
        subtotal: this.fmt(po.subtotal),
        totalTax: this.fmt(po.totalTax),
        totalAmount: this.fmt(po.totalAmount),
        status: po.status,
      });
    });

    this.addSummaryRow(sheet, `TOTAL (${pos.length} POs)`, ['','','','','','','',
      this.fmt(pos.reduce((s,p)=>s+p.totalAmount,0)),'']);
    this.styleDataRows(sheet);

    return workbook.xlsx.writeBuffer() as Promise<any>;
  }

  async exportSalesOrders(companyId: string, query: any): Promise<any> {
    const { status } = query;
    const where: any = { companyId, isActive: true };
    if (status) where.status = status;

    const sos = await this.prisma.salesOrder.findMany({
      where, orderBy: { createdAt: 'desc' },
    });

    const { workbook, sheet } = this.createWorkbook('Sales Orders');
    this.styleHeader(sheet, [
      { header: 'SO Number', key: 'soNumber', width: 18 },
      { header: 'Customer', key: 'customerName', width: 30 },
      { header: 'SO Date', key: 'soDate', width: 14 },
      { header: 'Delivery Date', key: 'deliveryDate', width: 14 },
      { header: 'Total Amount', key: 'totalAmount', width: 16 },
      { header: 'Status', key: 'status', width: 16 },
    ]);

    sos.forEach(so => {
      sheet.addRow({
        soNumber: so.soNumber,
        customerName: so.customerName,
        soDate: this.fmtDate(so.createdAt),
        deliveryDate: this.fmtDate(so.deliveryDate),
        totalAmount: this.fmt(so.totalAmount),
        status: so.status,
      });
    });

    this.addSummaryRow(sheet, `TOTAL (${sos.length} SOs)`, ['','','','',
      this.fmt(sos.reduce((s,o)=>s+o.totalAmount,0)),'']);
    this.styleDataRows(sheet);

    return workbook.xlsx.writeBuffer() as Promise<any>;
  }

  async exportStock(companyId: string): Promise<any> {
    const stock = await this.prisma.stockBalance.findMany({
      where: { companyId, isActive: true },
      include: { warehouse: { select: { name: true, code: true } } },
      orderBy: { itemCode: 'asc' },
    });

    const { workbook, sheet } = this.createWorkbook('Stock Report');
    this.styleHeader(sheet, [
      { header: 'Item Code', key: 'itemCode', width: 16 },
      { header: 'Item Name', key: 'itemName', width: 35 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'UOM', key: 'uom', width: 8 },
      { header: 'Warehouse', key: 'warehouse', width: 20 },
      { header: 'Qty Available', key: 'qtyAvailable', width: 14 },
      { header: 'Qty Reserved', key: 'qtyReserved', width: 14 },
      { header: 'Qty On Order', key: 'qtyOnOrder', width: 14 },
      { header: 'Reorder Level', key: 'reorderLevel', width: 14 },
      { header: 'Unit Cost', key: 'unitCost', width: 12 },
      { header: 'Stock Value', key: 'stockValue', width: 14 },
    ]);

    stock.forEach(s => {
      const value = (s.availableQty || 0) * (s.unitCost || 0);
      sheet.addRow({
        itemCode: s.itemCode,
        itemName: s.itemName,
        category: '—',
        uom: "PCS",
        warehouse: (s as any).warehouse?.name || '—',
        qtyAvailable: s.availableQty,
        qtyReserved: s.reservedQty || 0,
        qtyOnOrder: 0 || 0,
        reorderLevel: 0 || 0,
        unitCost: this.fmt(s.unitCost),
        stockValue: this.fmt(value),
      });
    });

    this.addSummaryRow(sheet, `TOTAL (${stock.length} items)`, ['','','','','','','','','','',
      this.fmt(stock.reduce((s,i)=>(s+(i.availableQty||0)*(i.unitCost||0)),0))]);
    this.styleDataRows(sheet);

    return workbook.xlsx.writeBuffer() as Promise<any>;
  }

  async exportNcr(companyId: string, query: any): Promise<any> {
    const { status } = query;
    const where: any = { companyId, isActive: true };
    if (status) where.status = status;

    const ncrs = await this.prisma.ncrRecord.findMany({ where, orderBy: { detectedDate: 'desc' } });

    const { workbook, sheet } = this.createWorkbook('NCR Register');
    this.styleHeader(sheet, [
      { header: 'NCR Number', key: 'ncrNumber', width: 18 },
      { header: 'Source', key: 'source', width: 16 },
      { header: 'Severity', key: 'severity', width: 12 },
      { header: 'Item Code', key: 'itemCode', width: 14 },
      { header: 'Item Name', key: 'itemName', width: 30 },
      { header: 'Qty', key: 'quantity', width: 8 },
      { header: 'Detected Date', key: 'detectedDate', width: 14 },
      { header: 'Detected By', key: 'detectedBy', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
    ]);

    ncrs.forEach((n: any) => {
      sheet.addRow({
        ncrNumber: n.ncrNumber,
        source: n.source,
        severity: n.severity,
        itemCode: n.itemCode || '—',
        itemName: n.itemName || '—',
        quantity: n.quantity || '—',
        detectedDate: this.fmtDate(n.detectedDate),
        detectedBy: n.detectedBy || '—',
        status: n.status,
      });
    });

    this.styleDataRows(sheet);
    return workbook.xlsx.writeBuffer() as Promise<any>;
  }

  async exportTasks(companyId: string, query: any): Promise<any> {
    const { status, category } = query;
    const where: any = { companyId, isActive: true };
    if (status) where.status = status;
    if (category) where.category = category;

    const tasks = await this.prisma.task.findMany({ where, orderBy: { dueDate: 'asc' } });

    const { workbook, sheet } = this.createWorkbook('Tasks');
    this.styleHeader(sheet, [
      { header: 'Task No', key: 'taskNumber', width: 16 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Category', key: 'category', width: 14 },
      { header: 'Priority', key: 'priority', width: 10 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Due Date', key: 'dueDate', width: 14 },
      { header: 'Assigned To', key: 'assignedTo', width: 20 },
      { header: 'Reference', key: 'referenceNumber', width: 18 },
    ]);

    tasks.forEach(t => {
      sheet.addRow({
        taskNumber: t.taskNumber,
        title: t.title,
        category: t.category,
        priority: t.priority,
        status: t.status,
        dueDate: this.fmtDate(t.dueDate),
        assignedTo: t.assignedTo,
        referenceNumber: t.referenceNumber || '—',
      });
    });

    this.styleDataRows(sheet);
    return workbook.xlsx.writeBuffer() as Promise<any>;
  }

  async exportTrialBalance(companyId: string, query: any): Promise<any> {
    const { period } = query;
    const now = new Date();
    const p = period || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const [year, month] = p.split('-').map(Number);
    const fromDate = new Date(year, month-1, 1);
    const toDate = new Date(year, month, 0, 23, 59, 59);

    const accounts = await this.prisma.account.findMany({
      where: { companyId, isActive: true }, orderBy: { accountCode: 'asc' },
    });
    const entries = await this.prisma.voucherEntry.findMany({
      where: { companyId, voucher: { status: 'POSTED', voucherDate: { gte: fromDate, lte: toDate } } },
    });

    const totals: Record<string, { dr: number; cr: number }> = {};
    entries.forEach(e => {
      if (!totals[e.accountId]) totals[e.accountId] = { dr: 0, cr: 0 };
      if (e.entryType === 'DEBIT') totals[e.accountId].dr += e.amount;
      else totals[e.accountId].cr += e.amount;
    });

    const { workbook, sheet } = this.createWorkbook(`Trial Balance ${p}`);
    this.styleHeader(sheet, [
      { header: 'Account Code', key: 'accountCode', width: 14 },
      { header: 'Account Name', key: 'accountName', width: 35 },
      { header: 'Type', key: 'accountType', width: 12 },
      { header: 'Opening Balance', key: 'openingBalance', width: 16 },
      { header: 'Period Debit', key: 'periodDebit', width: 14 },
      { header: 'Period Credit', key: 'periodCredit', width: 14 },
      { header: 'Closing Balance', key: 'closingBalance', width: 16 },
    ]);

    let totalDr = 0, totalCr = 0;
    accounts.forEach(acc => {
      const dr = totals[acc.id]?.dr || 0;
      const cr = totals[acc.id]?.cr || 0;
      if (dr === 0 && cr === 0 && acc.openingBalance === 0 && acc.currentBalance === 0) return;
      totalDr += dr; totalCr += cr;
      sheet.addRow({
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        openingBalance: this.fmt(acc.openingBalance),
        periodDebit: this.fmt(dr),
        periodCredit: this.fmt(cr),
        closingBalance: this.fmt(acc.currentBalance),
      });
    });

    this.addSummaryRow(sheet, 'TOTAL', ['','','', this.fmt(totalDr), this.fmt(totalCr),'']);
    this.styleDataRows(sheet);
    return workbook.xlsx.writeBuffer() as Promise<any>;
  }
}
