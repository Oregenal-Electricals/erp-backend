import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinancialReportsService {
  constructor(private prisma: PrismaService) {}

  private getPeriodDates(period?: string, fromDate?: string, toDate?: string) {
    if (fromDate && toDate) return { fromDate: new Date(fromDate), toDate: new Date(toDate) };
    const now = new Date();
    const p = period || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const [year, month] = p.split('-').map(Number);
    return { fromDate: new Date(year, month-1, 1), toDate: new Date(year, month, 0, 23, 59, 59) };
  }

  async getTrialBalance(user: any, query: any) {
    const { fromDate, toDate } = this.getPeriodDates(query.period, query.fromDate, query.toDate);

    const accounts = await this.prisma.account.findMany({
      where: { companyId: user.companyId, isActive: true },
      orderBy: { accountCode: 'asc' },
    });

    const entries = await this.prisma.voucherEntry.findMany({
      where: {
        companyId: user.companyId,
        voucher: { status: 'POSTED', voucherDate: { gte: fromDate, lte: toDate } },
      },
      include: { voucher: { select: { voucherDate: true } } },
    });

    const accountTotals: Record<string, { debit: number; credit: number }> = {};
    entries.forEach(e => {
      if (!accountTotals[e.accountId]) accountTotals[e.accountId] = { debit: 0, credit: 0 };
      if (e.entryType === 'DEBIT') accountTotals[e.accountId].debit += e.amount;
      else accountTotals[e.accountId].credit += e.amount;
    });

    const rows = accounts.map(acc => ({
      accountCode: acc.accountCode, accountName: acc.accountName,
      accountType: acc.accountType, accountSubType: acc.accountSubType,
      openingBalance: acc.openingBalance,
      periodDebit: accountTotals[acc.id]?.debit || 0,
      periodCredit: accountTotals[acc.id]?.credit || 0,
      closingBalance: acc.currentBalance,
    })).filter(r => r.periodDebit > 0 || r.periodCredit > 0 || r.openingBalance !== 0 || r.closingBalance !== 0);

    const totalDebit = rows.reduce((s, r) => s + r.periodDebit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.periodCredit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return { fromDate, toDate, rows, totalDebit, totalCredit, isBalanced };
  }

  async getProfitAndLoss(user: any, query: any) {
    const { fromDate, toDate } = this.getPeriodDates(query.period, query.fromDate, query.toDate);

    const accounts = await this.prisma.account.findMany({
      where: { companyId: user.companyId, isActive: true, accountType: { in: ['INCOME','EXPENSE'] } },
      orderBy: { accountCode: 'asc' },
    });

    const entries = await this.prisma.voucherEntry.findMany({
      where: {
        companyId: user.companyId,
        voucher: { status: 'POSTED', voucherDate: { gte: fromDate, lte: toDate } },
        account: { accountType: { in: ['INCOME','EXPENSE'] } },
      },
    });

    const accountTotals: Record<string, number> = {};
    entries.forEach(e => {
      if (!accountTotals[e.accountId]) accountTotals[e.accountId] = 0;
      if (e.entryType === 'CREDIT') accountTotals[e.accountId] += e.amount;
      else accountTotals[e.accountId] -= e.amount;
    });

    const income = accounts.filter(a => a.accountType === 'INCOME').map(a => ({
      accountCode: a.accountCode, accountName: a.accountName,
      accountSubType: a.accountSubType, amount: accountTotals[a.id] || 0,
    }));
    const cogs = accounts.filter(a => a.accountType === 'EXPENSE' && a.accountSubType === 'COGS').map(a => ({
      accountCode: a.accountCode, accountName: a.accountName,
      accountSubType: a.accountSubType, amount: Math.abs(accountTotals[a.id] || 0),
    }));
    const opex = accounts.filter(a => a.accountType === 'EXPENSE' && a.accountSubType !== 'COGS').map(a => ({
      accountCode: a.accountCode, accountName: a.accountName,
      accountSubType: a.accountSubType, amount: Math.abs(accountTotals[a.id] || 0),
    }));

    const totalIncome = income.reduce((s, a) => s + a.amount, 0);
    const totalCogs = cogs.reduce((s, a) => s + a.amount, 0);
    const grossProfit = totalIncome - totalCogs;
    const totalOpex = opex.reduce((s, a) => s + a.amount, 0);
    const netProfit = grossProfit - totalOpex;

    return {
      fromDate, toDate, income, cogs, opex,
      totalIncome, totalCogs, grossProfit, totalOpex, netProfit,
      grossMarginPct: totalIncome > 0 ? Math.round(grossProfit / totalIncome * 100 * 100) / 100 : 0,
      netMarginPct: totalIncome > 0 ? Math.round(netProfit / totalIncome * 100 * 100) / 100 : 0,
    };
  }

  async getBalanceSheet(user: any, query: any) {
    const { toDate } = this.getPeriodDates(query.period, query.fromDate, query.toDate);

    const accounts = await this.prisma.account.findMany({
      where: { companyId: user.companyId, isActive: true },
      orderBy: { accountCode: 'asc' },
    });

    const assets = accounts.filter(a => a.accountType === 'ASSET');
    const liabilities = accounts.filter(a => a.accountType === 'LIABILITY');
    const equity = accounts.filter(a => a.accountType === 'EQUITY');

    // Get P&L for retained earnings
    const plData = await this.getProfitAndLoss(user, { fromDate: `${new Date().getFullYear()}-01-01`, toDate: toDate.toISOString().split('T')[0] });

    const totalAssets = assets.reduce((s, a) => s + a.currentBalance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.currentBalance, 0);
    const totalEquity = equity.reduce((s, a) => s + a.currentBalance, 0);
    const retainedEarnings = plData.netProfit;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity + retainedEarnings;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

    return {
      asOf: toDate,
      assets: { items: assets.map(a => ({ accountCode: a.accountCode, accountName: a.accountName, accountSubType: a.accountSubType, balance: a.currentBalance })), total: totalAssets },
      liabilities: { items: liabilities.map(a => ({ accountCode: a.accountCode, accountName: a.accountName, accountSubType: a.accountSubType, balance: a.currentBalance })), total: totalLiabilities },
      equity: { items: equity.map(a => ({ accountCode: a.accountCode, accountName: a.accountName, balance: a.currentBalance })), total: totalEquity, retainedEarnings },
      totalLiabilitiesAndEquity, isBalanced,
    };
  }

  async getCashFlow(user: any, query: any) {
    const { fromDate, toDate } = this.getPeriodDates(query.period, query.fromDate, query.toDate);

    const bankAccounts = await this.prisma.account.findMany({
      where: { companyId: user.companyId, accountSubType: 'BANK', isActive: true },
    });

    const bankIds = bankAccounts.map(b => b.id);

    const receipts = await this.prisma.voucherEntry.findMany({
      where: {
        companyId: user.companyId, accountId: { in: bankIds }, entryType: 'DEBIT',
        voucher: { status: 'POSTED', voucherDate: { gte: fromDate, lte: toDate } },
      },
      include: { voucher: { select: { voucherNumber: true, voucherType: true, voucherDate: true, partyName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const payments = await this.prisma.voucherEntry.findMany({
      where: {
        companyId: user.companyId, accountId: { in: bankIds }, entryType: 'CREDIT',
        voucher: { status: 'POSTED', voucherDate: { gte: fromDate, lte: toDate } },
      },
      include: { voucher: { select: { voucherNumber: true, voucherType: true, voucherDate: true, partyName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const totalReceipts = receipts.reduce((s, e) => s + e.amount, 0);
    const totalPayments = payments.reduce((s, e) => s + e.amount, 0);
    const openingBalance = bankAccounts.reduce((s, b) => s + b.currentBalance, 0) - totalReceipts + totalPayments;
    const closingBalance = openingBalance + totalReceipts - totalPayments;

    return {
      fromDate, toDate,
      openingBalance: Math.round(openingBalance * 100) / 100,
      receipts: receipts.map(e => ({ amount: e.amount, voucherNumber: e.voucher.voucherNumber, voucherType: e.voucher.voucherType, date: e.voucher.voucherDate, party: e.voucher.partyName })),
      payments: payments.map(e => ({ amount: e.amount, voucherNumber: e.voucher.voucherNumber, voucherType: e.voucher.voucherType, date: e.voucher.voucherDate, party: e.voucher.partyName })),
      totalReceipts: Math.round(totalReceipts * 100) / 100,
      totalPayments: Math.round(totalPayments * 100) / 100,
      netCashFlow: Math.round((totalReceipts - totalPayments) * 100) / 100,
      closingBalance: Math.round(closingBalance * 100) / 100,
      bankAccounts: bankAccounts.map(b => ({ name: b.accountName, balance: b.currentBalance })),
    };
  }

  async getSummary(user: any) {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const [pl, bs, cf, arStats, apStats] = await Promise.all([
      this.getProfitAndLoss(user, { period }),
      this.getBalanceSheet(user, { period }),
      this.getCashFlow(user, { period }),
      this.prisma.arInvoice.aggregate({ where: { companyId: user.companyId, status: { in: ['SENT','PARTIAL','OVERDUE'] } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
      this.prisma.apBill.aggregate({ where: { companyId: user.companyId, status: { in: ['APPROVED','PARTIAL','OVERDUE'] } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
    ]);
    return {
      period, revenue: pl.totalIncome, grossProfit: pl.grossProfit, netProfit: pl.netProfit,
      grossMarginPct: pl.grossMarginPct, netMarginPct: pl.netMarginPct,
      totalAssets: bs.assets.total, totalLiabilities: bs.liabilities.total,
      cashBalance: cf.closingBalance,
      arOutstanding: arStats._sum.outstandingAmount || 0, arCount: arStats._count.id,
      apOutstanding: apStats._sum.outstandingAmount || 0, apCount: apStats._count.id,
    };
  }
}
