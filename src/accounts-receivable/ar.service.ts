import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateArInvoiceDto, CreateArPaymentDto } from './dto/ar.dto';

@Injectable()
export class ArService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateInvoiceNumber(companyId: string): Promise<string> {
    const count = await this.prisma.arInvoice.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generatePaymentNumber(companyId: string): Promise<string> {
    const count = await this.prisma.arPayment.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `RCPT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private calcDueDate(terms: string, fromDate: Date): Date {
    const days = { IMMEDIATE: 0, NET_30: 30, NET_45: 45, NET_60: 60, NET_90: 90 };
    const d = new Date(fromDate);
    d.setDate(d.getDate() + (days[terms] || 30));
    return d;
  }

  private includes() {
    return {
      dispatch: { select: { dispatchNumber: true, lrNumber: true } },
      salesOrder: { select: { soNumber: true, cpo: { select: { cpoNumber: true, customerPoNumber: true } } } },
      payments: true,
    };
  }

  async createFromDispatch(dispatchId: string, user: any) {
    const dispatch = await this.prisma.dispatch.findFirst({
      where: { id: dispatchId, companyId: user.companyId },
      include: { items: true, salesOrder: { include: { cpo: true } } },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    if (dispatch.status !== 'DELIVERED') throw new BadRequestException('Dispatch must be DELIVERED to create invoice');

    const existing = await this.prisma.arInvoice.findFirst({ where: { dispatchId, companyId: user.companyId } });
    if (existing) throw new BadRequestException('Invoice already exists for this dispatch');

    const subtotal = dispatch.items.reduce((s, i) => s + (i.dispatchedQty * i.unitPrice), 0);
    const totalGst = dispatch.items.reduce((s, i) => s + i.gstAmount, 0);
    const totalAmount = dispatch.items.reduce((s, i) => s + i.totalAmount, 0);
    const terms = 'NET_30';
    const invoiceDate = new Date();

    const invoiceNumber = await this.generateInvoiceNumber(user.companyId);

    const invoice = await this.prisma.arInvoice.create({
      data: {
        invoiceNumber, dispatchId, soId: dispatch.soId,
        customerName: dispatch.customerName,
        customerAddress: dispatch.deliveryAddress,
        invoiceDate, dueDate: this.calcDueDate(terms, invoiceDate),
        paymentTerms: terms, subtotal, totalGst, totalAmount,
        outstandingAmount: totalAmount, status: 'SENT',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    // Auto-create sales invoice voucher
    await this.createInvoiceVoucher(invoice, user);

    await this.audit.log({ tableName: 'ar_invoices', recordId: invoice.id, action: 'CREATE', newValues: invoice, changedBy: user.id });
    return invoice;
  }

  async create(dto: CreateArInvoiceDto, user: any) {
    const invoiceNumber = await this.generateInvoiceNumber(user.companyId);
    const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : new Date();
    const terms = dto.paymentTerms || 'NET_30';
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : this.calcDueDate(terms, invoiceDate);

    const invoice = await this.prisma.arInvoice.create({
      data: {
        invoiceNumber, dispatchId: dto.dispatchId, soId: dto.soId,
        customerName: dto.customerName, customerAddress: dto.customerAddress,
        invoiceDate, dueDate, paymentTerms: terms,
        subtotal: dto.subtotal, totalGst: dto.totalGst, totalAmount: dto.totalAmount,
        outstandingAmount: dto.totalAmount, notes: dto.notes,
        status: 'SENT',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.createInvoiceVoucher(invoice, user);
    await this.audit.log({ tableName: 'ar_invoices', recordId: invoice.id, action: 'CREATE', newValues: invoice, changedBy: user.id });
    return invoice;
  }

  private async createInvoiceVoucher(invoice: any, user: any) {
    // Find debtors and sales accounts
    const debtors = await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '1101' } });
    const sales = await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '4001' } });
    const cgst = await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '2101' } });
    const sgst = await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '2102' } });
    if (!debtors || !sales) return;

    const entries: any[] = [
      { accountId: debtors.id, entryType: 'DEBIT', amount: invoice.totalAmount, narration: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
      { accountId: sales.id, entryType: 'CREDIT', amount: invoice.subtotal, narration: `Sales - ${invoice.invoiceNumber}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    ];
    if (cgst && invoice.totalGst > 0) {
      const cgstAmt = Math.round(invoice.totalGst / 2 * 100) / 100;
      const sgstAmt = invoice.totalGst - cgstAmt;
      entries.push({ accountId: cgst.id, entryType: 'CREDIT', amount: cgstAmt, narration: `CGST - ${invoice.invoiceNumber}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id });
      if (sgst) entries.push({ accountId: sgst.id, entryType: 'CREDIT', amount: sgstAmt, narration: `SGST - ${invoice.invoiceNumber}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id });
    }

    const count = await this.prisma.voucher.count({ where: { companyId: user.companyId } });
    const voucher = await this.prisma.voucher.create({
      data: {
        voucherNumber: `SINV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
        voucherType: 'SALES_INVOICE', voucherDate: invoice.invoiceDate,
        referenceNumber: invoice.invoiceNumber, referenceType: 'AR_INVOICE',
        partyName: invoice.customerName, narration: `Auto-voucher for ${invoice.invoiceNumber}`,
        totalAmount: invoice.totalAmount, status: 'POSTED',
        postedDate: new Date(), postedBy: user.id,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        entries: { create: entries },
      },
    });

    // Update account balances
    await this.prisma.account.update({ where: { id: debtors.id }, data: { currentBalance: { increment: invoice.totalAmount } } });
    await this.prisma.account.update({ where: { id: sales.id }, data: { currentBalance: { increment: invoice.subtotal } } });
    if (cgst && invoice.totalGst > 0) {
      const cgstAmt = Math.round(invoice.totalGst / 2 * 100) / 100;
      await this.prisma.account.update({ where: { id: cgst.id }, data: { currentBalance: { increment: cgstAmt } } });
      if (sgst) await this.prisma.account.update({ where: { id: sgst.id }, data: { currentBalance: { increment: invoice.totalGst - cgstAmt } } });
    }

    await this.prisma.arInvoice.update({ where: { id: invoice.id }, data: { voucherId: voucher.id } });
  }

  async recordPayment(dto: CreateArPaymentDto, user: any) {
    const invoice = await this.prisma.arInvoice.findFirst({ where: { id: dto.invoiceId, companyId: user.companyId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (['PAID','CANCELLED'].includes(invoice.status)) throw new BadRequestException(`Invoice is already ${invoice.status}`);
    if (dto.amount > invoice.outstandingAmount) throw new BadRequestException(`Payment amount ${dto.amount} exceeds outstanding ${invoice.outstandingAmount}`);

    const paymentNumber = await this.generatePaymentNumber(user.companyId);
    const payment = await this.prisma.arPayment.create({
      data: {
        paymentNumber, invoiceId: dto.invoiceId,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        amount: dto.amount, paymentMode: dto.paymentMode,
        referenceNumber: dto.referenceNumber, bankAccountId: dto.bankAccountId,
        remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });

    const newPaid = invoice.paidAmount + dto.amount;
    const newOutstanding = invoice.totalAmount - newPaid;
    const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIAL';

    await this.prisma.arInvoice.update({
      where: { id: dto.invoiceId },
      data: { paidAmount: newPaid, outstandingAmount: Math.max(0, newOutstanding), status: newStatus, updatedBy: user.id },
    });

    // Auto-create receipt voucher
    await this.createReceiptVoucher(payment, invoice, dto, user);
    await this.audit.log({ tableName: 'ar_payments', recordId: payment.id, action: 'CREATE', newValues: payment, changedBy: user.id });
    return payment;
  }

  private async createReceiptVoucher(payment: any, invoice: any, dto: any, user: any) {
    const debtors = await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '1101' } });
    const bank = dto.bankAccountId
      ? await this.prisma.account.findFirst({ where: { id: dto.bankAccountId, companyId: user.companyId } })
      : await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '1002' } });
    if (!debtors || !bank) return;

    const count = await this.prisma.voucher.count({ where: { companyId: user.companyId } });
    await this.prisma.voucher.create({
      data: {
        voucherNumber: `RCP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
        voucherType: 'RECEIPT', voucherDate: payment.paymentDate,
        referenceNumber: invoice.invoiceNumber, referenceType: 'AR_PAYMENT',
        partyName: invoice.customerName, narration: `Payment received - ${invoice.invoiceNumber}`,
        totalAmount: dto.amount, status: 'POSTED',
        postedDate: new Date(), postedBy: user.id,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        entries: {
          create: [
            { accountId: bank.id, entryType: 'DEBIT', amount: dto.amount, narration: `Receipt - ${payment.paymentNumber}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
            { accountId: debtors.id, entryType: 'CREDIT', amount: dto.amount, narration: `Debtors cleared - ${invoice.invoiceNumber}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
          ],
        },
      },
    });
    await this.prisma.account.update({ where: { id: bank.id }, data: { currentBalance: { increment: dto.amount } } });
    await this.prisma.account.update({ where: { id: debtors.id }, data: { currentBalance: { decrement: dto.amount } } });
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (search) where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.arInvoice.findMany({
        where, skip, take: Number(limit), orderBy: { invoiceDate: 'desc' },
        include: { payments: { select: { id: true, amount: true, paymentDate: true } }, dispatch: { select: { dispatchNumber: true } }, salesOrder: { select: { soNumber: true } } },
      }),
      this.prisma.arInvoice.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const inv = await this.prisma.arInvoice.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const now = new Date();
    const [total, sent, partial, paid, overdue] = await Promise.all([
      this.prisma.arInvoice.count({ where }),
      this.prisma.arInvoice.count({ where: { ...where, status: 'SENT' } }),
      this.prisma.arInvoice.count({ where: { ...where, status: 'PARTIAL' } }),
      this.prisma.arInvoice.count({ where: { ...where, status: 'PAID' } }),
      this.prisma.arInvoice.count({ where: { ...where, status: { in: ['SENT','PARTIAL'] }, dueDate: { lt: now } } }),
    ]);
    const outstanding = await this.prisma.arInvoice.aggregate({ where: { ...where, status: { in: ['SENT','PARTIAL','OVERDUE'] } }, _sum: { outstandingAmount: true } });
    const collected = await this.prisma.arInvoice.aggregate({ where, _sum: { paidAmount: true } });
    return { total, sent, partial, paid, overdue, totalOutstanding: outstanding._sum.outstandingAmount || 0, totalCollected: collected._sum.paidAmount || 0 };
  }

  async getAgingReport(user: any) {
    const invoices = await this.prisma.arInvoice.findMany({
      where: { companyId: user.companyId, status: { in: ['SENT','PARTIAL','OVERDUE'] } },
      orderBy: { dueDate: 'asc' },
    });
    const now = new Date();
    const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
    const agingInvoices = invoices.map(inv => {
      const days = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
      let bucket = 'current';
      if (days > 90) { aging.over90 += inv.outstandingAmount; bucket = 'over90'; }
      else if (days > 60) { aging.days90 += inv.outstandingAmount; bucket = 'days90'; }
      else if (days > 30) { aging.days60 += inv.outstandingAmount; bucket = 'days60'; }
      else if (days > 0) { aging.days30 += inv.outstandingAmount; bucket = 'days30'; }
      else { aging.current += inv.outstandingAmount; }
      return { ...inv, agingDays: days, agingBucket: bucket };
    });
    return { aging, invoices: agingInvoices };
  }
}
