import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateVoucherDto, CancelVoucherDto } from './dto/voucher.dto';

const PREFIXES: Record<string, string> = {
  SALES_INVOICE: 'SINV', RECEIPT: 'RCP', PURCHASE_BILL: 'PBILL',
  PAYMENT: 'PMT', JOURNAL: 'JV', CREDIT_NOTE: 'CN', DEBIT_NOTE: 'DN',
};

@Injectable()
export class VouchersService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string, voucherType: string): Promise<string> {
    const prefix = PREFIXES[voucherType] || 'VCH';
    const count = await this.prisma.voucher.count({ where: { companyId, voucherType } });
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      entries: { include: { account: { select: { accountCode: true, accountName: true, accountType: true } } } },
    };
  }

  async create(dto: CreateVoucherDto, user: any) {
    // Validate balance — total debits must equal total credits
    const totalDebit = dto.entries.filter(e => e.entryType === 'DEBIT').reduce((s, e) => s + e.amount, 0);
    const totalCredit = dto.entries.filter(e => e.entryType === 'CREDIT').reduce((s, e) => s + e.amount, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(`Voucher not balanced: Debit=${totalDebit} Credit=${totalCredit}. Difference=${Math.abs(totalDebit - totalCredit)}`);
    }
    if (dto.entries.length < 2) throw new BadRequestException('Minimum 2 entries required for double-entry bookkeeping');

    // Validate all accounts exist
    for (const entry of dto.entries) {
      const acc = await this.prisma.account.findFirst({ where: { id: entry.accountId, companyId: user.companyId, isActive: true } });
      if (!acc) throw new NotFoundException(`Account ${entry.accountId} not found`);
    }

    const voucherNumber = await this.generateNumber(user.companyId, dto.voucherType);

    const voucher = await this.prisma.voucher.create({
      data: {
        voucherNumber, voucherType: dto.voucherType,
        voucherDate: dto.voucherDate ? new Date(dto.voucherDate) : new Date(),
        referenceId: dto.referenceId, referenceType: dto.referenceType,
        referenceNumber: dto.referenceNumber, partyName: dto.partyName,
        narration: dto.narration, totalAmount: totalDebit,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        entries: {
          create: dto.entries.map(e => ({
            accountId: e.accountId, entryType: e.entryType,
            amount: e.amount, narration: e.narration,
            companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
          })),
        },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'vouchers', recordId: voucher.id, action: 'CREATE', newValues: voucher, changedBy: user.id });
    return voucher;
  }

  async post(id: string, user: any) {
    const voucher = await this.prisma.voucher.findFirst({ where: { id, companyId: user.companyId }, include: { entries: true } });
    if (!voucher) throw new NotFoundException('Voucher not found');
    if (voucher.status !== 'DRAFT') throw new BadRequestException('Only DRAFT vouchers can be posted');

    // Update account balances
    for (const entry of voucher.entries) {
      const account = await this.prisma.account.findFirst({ where: { id: entry.accountId } });
      if (!account) continue;

      // Normal balance rules:
      // ASSET & EXPENSE: DEBIT increases, CREDIT decreases
      // LIABILITY & EQUITY & INCOME: CREDIT increases, DEBIT decreases
      let balanceChange = 0;
      if (['ASSET','EXPENSE'].includes(account.accountType)) {
        balanceChange = entry.entryType === 'DEBIT' ? entry.amount : -entry.amount;
      } else {
        balanceChange = entry.entryType === 'CREDIT' ? entry.amount : -entry.amount;
      }

      await this.prisma.account.update({
        where: { id: entry.accountId },
        data: { currentBalance: { increment: balanceChange } },
      });
    }

    const updated = await this.prisma.voucher.update({
      where: { id },
      data: { status: 'POSTED', postedDate: new Date(), postedBy: user.id, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'vouchers', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, dto: CancelVoucherDto, user: any) {
    const voucher = await this.prisma.voucher.findFirst({ where: { id, companyId: user.companyId }, include: { entries: true } });
    if (!voucher) throw new NotFoundException('Voucher not found');
    if (voucher.status === 'CANCELLED') throw new BadRequestException('Already cancelled');

    // Reverse account balances if posted
    if (voucher.status === 'POSTED') {
      for (const entry of voucher.entries) {
        const account = await this.prisma.account.findFirst({ where: { id: entry.accountId } });
        if (!account) continue;
        let balanceChange = 0;
        if (['ASSET','EXPENSE'].includes(account.accountType)) {
          balanceChange = entry.entryType === 'DEBIT' ? -entry.amount : entry.amount;
        } else {
          balanceChange = entry.entryType === 'CREDIT' ? -entry.amount : entry.amount;
        }
        await this.prisma.account.update({ where: { id: entry.accountId }, data: { currentBalance: { increment: balanceChange } } });
      }
    }

    const updated = await this.prisma.voucher.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledDate: new Date(), cancelReason: dto.cancelReason, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'vouchers', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, voucherType, status, search } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (voucherType) where.voucherType = voucherType;
    if (status) where.status = status;
    if (search) where.OR = [
      { voucherNumber: { contains: search, mode: 'insensitive' } },
      { partyName: { contains: search, mode: 'insensitive' } },
      { referenceNumber: { contains: search, mode: 'insensitive' } },
    ];

    const [data, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where, skip, take: Number(limit), orderBy: { voucherDate: 'desc' },
        include: { entries: { select: { entryType: true, amount: true, account: { select: { accountCode: true, accountName: true } } } } },
      }),
      this.prisma.voucher.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const voucher = await this.prisma.voucher.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!voucher) throw new NotFoundException('Voucher not found');
    return voucher;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, draft, posted, cancelled] = await Promise.all([
      this.prisma.voucher.count({ where }),
      this.prisma.voucher.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.voucher.count({ where: { ...where, status: 'POSTED' } }),
      this.prisma.voucher.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    const byType = await this.prisma.voucher.groupBy({ by: ['voucherType'], where, _count: { id: true } });
    const valueAgg = await this.prisma.voucher.aggregate({ where: { ...where, status: 'POSTED' }, _sum: { totalAmount: true } });
    return { total, draft, posted, cancelled, totalPostedValue: valueAgg._sum.totalAmount || 0, byType };
  }

  // Create a sales invoice voucher from delivery confirmation
  async createSalesInvoiceFromDelivery(deliveryId: string, user: any) {
    const dc = await this.prisma.deliveryConfirmation.findFirst({
      where: { id: deliveryId, companyId: user.companyId },
      include: { dispatch: { include: { items: true, salesOrder: { include: { cpo: true } } } } },
    });
    if (!dc) throw new NotFoundException('Delivery confirmation not found');

    const dispatch = dc.dispatch;
    const so = dispatch.salesOrder;

    // Get required accounts
    const [debtorAcc, salesAcc, cgstAcc, sgstAcc] = await Promise.all([
      this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '1101' } }),
      this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '4001' } }),
      this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '2101' } }),
      this.prisma.account.findFirst({ where: { companyId: user.companyId, accountCode: '2102' } }),
    ]);

    if (!debtorAcc || !salesAcc || !cgstAcc || !sgstAcc) throw new BadRequestException('Required accounts not found. Please seed Chart of Accounts first.');

    // Calculate totals from dispatch items
    const subtotal = dispatch.items.reduce((s, i) => s + (i.dispatchedQty * i.unitPrice), 0);
    const totalGst = dispatch.items.reduce((s, i) => s + i.gstAmount, 0);
    const totalAmount = Math.round((subtotal + totalGst) * 100) / 100;
    const cgst = Math.round(totalGst / 2 * 100) / 100;
    const sgst = Math.round(totalGst / 2 * 100) / 100;

    return this.create({
      voucherType: 'SALES_INVOICE',
      voucherDate: dc.deliveryDate.toISOString(),
      referenceId: dc.id,
      referenceType: 'DELIVERY_CONFIRMATION',
      referenceNumber: dc.dcNumber,
      partyName: so.customerName,
      narration: `Sales Invoice for ${dc.dcNumber} | SO: ${so.soNumber} | Customer PO: ${so.cpo?.customerPoNumber || '—'}`,
      entries: [
        { accountId: debtorAcc.id, entryType: 'DEBIT', amount: totalAmount, narration: `Debtor — ${so.customerName}` },
        { accountId: salesAcc.id, entryType: 'CREDIT', amount: subtotal, narration: 'Sales Revenue' },
        { accountId: cgstAcc.id, entryType: 'CREDIT', amount: cgst, narration: 'CGST Payable' },
        { accountId: sgstAcc.id, entryType: 'CREDIT', amount: sgst, narration: 'SGST Payable' },
      ],
    }, user);
  }
}
