import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateApBillDto, CreateApPaymentDto } from './dto/ap.dto';

@Injectable()
export class ApService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateBillNumber(companyId: string): Promise<string> {
    const count = await this.prisma.apBill.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `BILL-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generatePaymentNumber(companyId: string): Promise<string> {
    const count = await this.prisma.apPayment.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `VPAY-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private calcDueDate(terms: string, fromDate: Date): Date {
    const days = { IMMEDIATE: 0, NET_30: 30, NET_45: 45, NET_60: 60, NET_90: 90 };
    const d = new Date(fromDate);
    d.setDate(d.getDate() + (days[terms] || 30));
    return d;
  }

  private includes() {
    return {
      vendor: { select: { name: true, code: true } },
      po: { select: { poNumber: true } },
      payments: true,
    };
  }

  private async getBillableSummary(poId: string, companyId: string) {
    const grns = await this.prisma.grnHeader.findMany({
      where: { poId, companyId, isActive: true },
      include: { items: { where: { isActive: true } } },
    });
    const totalAcceptedValue = grns.reduce((sum, grn) => {
      return sum + grn.items.reduce((s, item: any) => {
        const unitCost = item.landedCostPerUnit || item.unitPrice || 0;
        return s + (item.acceptedQty || 0) * unitCost;
      }, 0);
    }, 0);

    const existingBills = await this.prisma.apBill.findMany({
      where: { poId, companyId, isActive: true, status: { not: 'CANCELLED' } },
    });
    const alreadyBilled = existingBills.reduce((s, b) => s + b.totalAmount, 0);

    const remainingBillable = totalAcceptedValue - alreadyBilled;
    const maxAllowed = remainingBillable * 1.05;

    return { totalAcceptedValue, alreadyBilled, remainingBillable, maxAllowed };
  }

  async getBillable(poId: string, user: any) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id: poId, companyId: user.companyId } });
    if (!po) throw new NotFoundException('Purchase Order not found');
    return this.getBillableSummary(poId, user.companyId);
  }

  async create(dto: CreateApBillDto, user: any) {
    if (dto.vendorId) {
      const vendor = await this.prisma.vendor.findFirst({ where: { id: dto.vendorId, companyId: user.companyId } });
      if (!vendor) throw new NotFoundException('Vendor not found');
    }

    if (dto.poId) {
      const summary = await this.getBillableSummary(dto.poId, user.companyId);
      if (dto.totalAmount > summary.maxAllowed) {
        throw new BadRequestException(
          `This invoice (${dto.totalAmount}) exceeds what's billable against this PO. ` +
          `Total accepted value so far: ${summary.totalAcceptedValue.toFixed(2)}, already billed: ${summary.alreadyBilled.toFixed(2)}, ` +
          `remaining billable: ${summary.remainingBillable.toFixed(2)}. Check that goods were received and passed IQC before invoicing.`
        );
      }
    }

    const billNumber = await this.generateBillNumber(user.companyId);
    const billDate = dto.billDate ? new Date(dto.billDate) : new Date();
    const terms = dto.paymentTerms || 'NET_30';
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : this.calcDueDate(terms, billDate);

    const bill = await this.prisma.apBill.create({
      data: {
        billNumber, vendorBillNumber: dto.vendorBillNumber,
        vendorId: dto.vendorId, vendorName: dto.vendorName,
        poId: dto.poId, billDate, dueDate, paymentTerms: terms,
        subtotal: dto.subtotal, totalGst: dto.totalGst, totalAmount: dto.totalAmount,
        outstandingAmount: dto.totalAmount, remarks: dto.remarks,
        status: 'APPROVED',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    // Auto-create purchase bill voucher
    await this.createBillVoucher(bill, user);
    await this.audit.log({ tableName: 'ap_bills', recordId: bill.id, action: 'CREATE', newValues: bill, changedBy: user.id });
    return bill;
  }

  private async createBillVoucher(bill: any, user: any) {
    const creditors = await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '2001' } });
    const purchases = await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '5001' } });
    const cgstInput = await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '2104' } });
    const sgstInput = await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '2105' } });
    if (!creditors || !purchases) return;

    const entries: any[] = [
      { accountId: purchases.id, entryType: 'DEBIT', amount: bill.subtotal, narration: `Purchases - ${bill.billNumber}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
    ];
    if (cgstInput && bill.totalGst > 0) {
      const cgstAmt = Math.round(bill.totalGst / 2 * 100) / 100;
      entries.push({ accountId: cgstInput.id, entryType: 'DEBIT', amount: cgstAmt, narration: `CGST Input - ${bill.billNumber}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id });
      if (sgstInput) entries.push({ accountId: sgstInput.id, entryType: 'DEBIT', amount: bill.totalGst - cgstAmt, narration: `SGST Input - ${bill.billNumber}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id });
    }
    entries.push({ accountId: creditors.id, entryType: 'CREDIT', amount: bill.totalAmount, narration: `Trade Creditors - ${bill.vendorName}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id });

    const count = await this.prisma.voucher.count({ where: { companyId: user.companyId } });
    await this.prisma.voucher.create({
      data: {
        voucherNumber: `PBIL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
        voucherType: 'PURCHASE_BILL', voucherDate: bill.billDate,
        referenceNumber: bill.billNumber, referenceType: 'AP_BILL',
        partyName: bill.vendorName, narration: `Auto-voucher for ${bill.billNumber}`,
        totalAmount: bill.totalAmount, status: 'POSTED',
        postedDate: new Date(), postedBy: user.id,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        entries: { create: entries },
      },
    });

    // Update balances
    await this.prisma.account.update({ where: { id: purchases.id }, data: { currentBalance: { increment: bill.subtotal } } });
    await this.prisma.account.update({ where: { id: creditors.id }, data: { currentBalance: { increment: bill.totalAmount } } });
    if (cgstInput && bill.totalGst > 0) {
      const cgstAmt = Math.round(bill.totalGst / 2 * 100) / 100;
      await this.prisma.account.update({ where: { id: cgstInput.id }, data: { currentBalance: { increment: cgstAmt } } });
      if (sgstInput) await this.prisma.account.update({ where: { id: sgstInput.id }, data: { currentBalance: { increment: bill.totalGst - cgstAmt } } });
    }
    await this.prisma.apBill.update({ where: { id: bill.id }, data: { voucherId: count.toString() } });
  }

  async recordPayment(dto: CreateApPaymentDto, user: any) {
    const bill = await this.prisma.apBill.findFirst({ where: { id: dto.billId, companyId: user.companyId } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (['PAID','CANCELLED'].includes(bill.status)) throw new BadRequestException(`Bill is already ${bill.status}`);
    if (dto.amount > bill.outstandingAmount) throw new BadRequestException(`Payment ${dto.amount} exceeds outstanding ${bill.outstandingAmount}`);

    const paymentNumber = await this.generatePaymentNumber(user.companyId);
    const payment = await this.prisma.apPayment.create({
      data: {
        paymentNumber, billId: dto.billId,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        amount: dto.amount, paymentMode: dto.paymentMode,
        referenceNumber: dto.referenceNumber, bankAccountId: dto.bankAccountId,
        remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });

    const newPaid = bill.paidAmount + dto.amount;
    const newOutstanding = bill.totalAmount - newPaid;
    const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIAL';

    await this.prisma.apBill.update({
      where: { id: dto.billId },
      data: { paidAmount: newPaid, outstandingAmount: Math.max(0, newOutstanding), status: newStatus, updatedBy: user.id },
    });

    // Auto payment voucher
    await this.createPaymentVoucher(payment, bill, dto, user);
    await this.audit.log({ tableName: 'ap_payments', recordId: payment.id, action: 'CREATE', newValues: payment, changedBy: user.id });
    return payment;
  }

  private async createPaymentVoucher(payment: any, bill: any, dto: any, user: any) {
    const creditors = await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '2001' } });
    const bank = dto.bankAccountId
      ? await this.prisma.account.findFirst({ where: { id: dto.bankAccountId, companyId: user.companyId } })
      : await this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '1002' } });
    if (!creditors || !bank) return;

    const count = await this.prisma.voucher.count({ where: { companyId: user.companyId } });
    await this.prisma.voucher.create({
      data: {
        voucherNumber: `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
        voucherType: 'PAYMENT', voucherDate: payment.paymentDate,
        referenceNumber: bill.billNumber, referenceType: 'AP_PAYMENT',
        partyName: bill.vendorName, narration: `Vendor payment - ${bill.billNumber}`,
        totalAmount: dto.amount, status: 'POSTED',
        postedDate: new Date(), postedBy: user.id,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        entries: {
          create: [
            { accountId: creditors.id, entryType: 'DEBIT', amount: dto.amount, narration: `Creditors cleared - ${bill.billNumber}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
            { accountId: bank.id, entryType: 'CREDIT', amount: dto.amount, narration: `Bank payment - ${payment.paymentNumber}`, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
          ],
        },
      },
    });
    await this.prisma.account.update({ where: { id: creditors.id }, data: { currentBalance: { decrement: dto.amount } } });
    await this.prisma.account.update({ where: { id: bank.id }, data: { currentBalance: { decrement: dto.amount } } });
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (search) where.OR = [
      { billNumber: { contains: search, mode: 'insensitive' } },
      { vendorName: { contains: search, mode: 'insensitive' } },
      { vendorBillNumber: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.apBill.findMany({
        where, skip, take: Number(limit), orderBy: { billDate: 'desc' },
        include: { vendor: { select: { name: true, code: true } }, po: { select: { poNumber: true } }, payments: { select: { id: true, amount: true, paymentDate: true } } },
      }),
      this.prisma.apBill.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const bill = await this.prisma.apBill.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const now = new Date();
    const [total, approved, partial, paid, overdue] = await Promise.all([
      this.prisma.apBill.count({ where }),
      this.prisma.apBill.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.apBill.count({ where: { ...where, status: 'PARTIAL' } }),
      this.prisma.apBill.count({ where: { ...where, status: 'PAID' } }),
      this.prisma.apBill.count({ where: { ...where, status: { in: ['APPROVED','PARTIAL'] }, dueDate: { lt: now } } }),
    ]);
    const outstanding = await this.prisma.apBill.aggregate({ where: { ...where, status: { in: ['APPROVED','PARTIAL','OVERDUE'] } }, _sum: { outstandingAmount: true } });
    const paid_amt = await this.prisma.apBill.aggregate({ where, _sum: { paidAmount: true } });
    return { total, approved, partial, paid, overdue, totalOutstanding: outstanding._sum.outstandingAmount || 0, totalPaid: paid_amt._sum.paidAmount || 0 };
  }

  async getAgingReport(user: any) {
    const bills = await this.prisma.apBill.findMany({
      where: { companyId: user.companyId, status: { in: ['APPROVED','PARTIAL','OVERDUE'] } },
      orderBy: { dueDate: 'asc' },
      include: { vendor: { select: { name: true } } },
    });
    const now = new Date();
    const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
    const agingBills = bills.map(b => {
      const days = Math.floor((now.getTime() - new Date(b.dueDate).getTime()) / 86400000);
      if (days > 90) aging.over90 += b.outstandingAmount;
      else if (days > 60) aging.days90 += b.outstandingAmount;
      else if (days > 30) aging.days60 += b.outstandingAmount;
      else if (days > 0) aging.days30 += b.outstandingAmount;
      else aging.current += b.outstandingAmount;
      return { ...b, agingDays: days };
    });
    return { aging, bills: agingBills };
  }
}
