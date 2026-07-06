import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateGroupDto, CreateAccountDto } from './dto/accounting.dto';

// Standard Indian Chart of Accounts seed data
const DEFAULT_GROUPS = [
  // ASSETS
  { code: 'CA', name: 'Current Assets', type: 'ASSET', nature: 'DEBIT', parentGroupId: null },
  { code: 'FA', name: 'Fixed Assets', type: 'ASSET', nature: 'DEBIT', parentGroupId: null },
  { code: 'OA', name: 'Other Assets', type: 'ASSET', nature: 'DEBIT', parentGroupId: null },
  // LIABILITIES
  { code: 'CL', name: 'Current Liabilities', type: 'LIABILITY', nature: 'CREDIT', parentGroupId: null },
  { code: 'LL', name: 'Long-term Liabilities', type: 'LIABILITY', nature: 'CREDIT', parentGroupId: null },
  // EQUITY
  { code: 'EQ', name: 'Equity & Reserves', type: 'EQUITY', nature: 'CREDIT', parentGroupId: null },
  // REVENUE
  { code: 'SR', name: 'Sales Revenue', type: 'REVENUE', nature: 'CREDIT', parentGroupId: null },
  { code: 'OI', name: 'Other Income', type: 'REVENUE', nature: 'CREDIT', parentGroupId: null },
  // EXPENSES
  { code: 'COGS', name: 'Cost of Goods Sold', type: 'EXPENSE', nature: 'DEBIT', parentGroupId: null },
  { code: 'OE', name: 'Operating Expenses', type: 'EXPENSE', nature: 'DEBIT', parentGroupId: null },
  { code: 'FE', name: 'Finance Expenses', type: 'EXPENSE', nature: 'DEBIT', parentGroupId: null },
  { code: 'TE', name: 'Tax Expenses', type: 'EXPENSE', nature: 'DEBIT', parentGroupId: null },
];

const DEFAULT_ACCOUNTS = [
  // Current Assets
  { code: '1001', name: 'Cash in Hand', groupCode: 'CA', nature: 'DEBIT', type: 'ASSET', isCashAccount: true },
  { code: '1002', name: 'Bank Account - Current', groupCode: 'CA', nature: 'DEBIT', type: 'ASSET', isBankAccount: true },
  { code: '1011', name: 'Accounts Receivable', groupCode: 'CA', nature: 'DEBIT', type: 'ASSET' },
  { code: '1012', name: 'GST Input Credit (CGST)', groupCode: 'CA', nature: 'DEBIT', type: 'ASSET', gstApplicable: true },
  { code: '1013', name: 'GST Input Credit (SGST)', groupCode: 'CA', nature: 'DEBIT', type: 'ASSET', gstApplicable: true },
  { code: '1014', name: 'GST Input Credit (IGST)', groupCode: 'CA', nature: 'DEBIT', type: 'ASSET', gstApplicable: true },
  { code: '1021', name: 'Inventory - Raw Materials', groupCode: 'CA', nature: 'DEBIT', type: 'ASSET' },
  { code: '1022', name: 'Inventory - WIP', groupCode: 'CA', nature: 'DEBIT', type: 'ASSET' },
  { code: '1023', name: 'Inventory - Finished Goods', groupCode: 'CA', nature: 'DEBIT', type: 'ASSET' },
  { code: '1031', name: 'Advance to Suppliers', groupCode: 'CA', nature: 'DEBIT', type: 'ASSET' },
  { code: '1041', name: 'TDS Receivable', groupCode: 'CA', nature: 'DEBIT', type: 'ASSET' },
  // Fixed Assets
  { code: '1501', name: 'Land & Building', groupCode: 'FA', nature: 'DEBIT', type: 'ASSET' },
  { code: '1502', name: 'Plant & Machinery', groupCode: 'FA', nature: 'DEBIT', type: 'ASSET' },
  { code: '1503', name: 'Furniture & Fixtures', groupCode: 'FA', nature: 'DEBIT', type: 'ASSET' },
  { code: '1504', name: 'Computers & Equipment', groupCode: 'FA', nature: 'DEBIT', type: 'ASSET' },
  { code: '1505', name: 'Vehicles', groupCode: 'FA', nature: 'DEBIT', type: 'ASSET' },
  { code: '1511', name: 'Accumulated Depreciation', groupCode: 'FA', nature: 'CREDIT', type: 'ASSET' },
  // Current Liabilities
  { code: '2001', name: 'Accounts Payable', groupCode: 'CL', nature: 'CREDIT', type: 'LIABILITY' },
  { code: '2011', name: 'GST Payable (CGST)', groupCode: 'CL', nature: 'CREDIT', type: 'LIABILITY', gstApplicable: true },
  { code: '2012', name: 'GST Payable (SGST)', groupCode: 'CL', nature: 'CREDIT', type: 'LIABILITY', gstApplicable: true },
  { code: '2013', name: 'GST Payable (IGST)', groupCode: 'CL', nature: 'CREDIT', type: 'LIABILITY', gstApplicable: true },
  { code: '2021', name: 'TDS Payable', groupCode: 'CL', nature: 'CREDIT', type: 'LIABILITY' },
  { code: '2022', name: 'PF Payable', groupCode: 'CL', nature: 'CREDIT', type: 'LIABILITY' },
  { code: '2023', name: 'ESI Payable', groupCode: 'CL', nature: 'CREDIT', type: 'LIABILITY' },
  { code: '2031', name: 'Salary Payable', groupCode: 'CL', nature: 'CREDIT', type: 'LIABILITY' },
  { code: '2041', name: 'Advance from Customers', groupCode: 'CL', nature: 'CREDIT', type: 'LIABILITY' },
  { code: '2051', name: 'Short-term Loans', groupCode: 'CL', nature: 'CREDIT', type: 'LIABILITY' },
  // Long-term Liabilities
  { code: '2501', name: 'Long-term Bank Loans', groupCode: 'LL', nature: 'CREDIT', type: 'LIABILITY' },
  { code: '2502', name: 'Deferred Tax Liability', groupCode: 'LL', nature: 'CREDIT', type: 'LIABILITY' },
  // Equity
  { code: '3001', name: 'Share Capital', groupCode: 'EQ', nature: 'CREDIT', type: 'EQUITY' },
  { code: '3002', name: 'Retained Earnings', groupCode: 'EQ', nature: 'CREDIT', type: 'EQUITY' },
  { code: '3003', name: 'General Reserve', groupCode: 'EQ', nature: 'CREDIT', type: 'EQUITY' },
  // Sales Revenue
  { code: '4001', name: 'Sales - Domestic', groupCode: 'SR', nature: 'CREDIT', type: 'REVENUE' },
  { code: '4002', name: 'Sales - Export', groupCode: 'SR', nature: 'CREDIT', type: 'REVENUE' },
  { code: '4003', name: 'Sales Returns & Allowances', groupCode: 'SR', nature: 'DEBIT', type: 'REVENUE' },
  // Other Income
  { code: '4101', name: 'Interest Income', groupCode: 'OI', nature: 'CREDIT', type: 'REVENUE' },
  { code: '4102', name: 'Discount Received', groupCode: 'OI', nature: 'CREDIT', type: 'REVENUE' },
  { code: '4103', name: 'Other Income', groupCode: 'OI', nature: 'CREDIT', type: 'REVENUE' },
  // COGS
  { code: '5001', name: 'Cost of Materials Consumed', groupCode: 'COGS', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5002', name: 'Direct Labour', groupCode: 'COGS', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5003', name: 'Manufacturing Overhead', groupCode: 'COGS', nature: 'DEBIT', type: 'EXPENSE' },
  // Operating Expenses
  { code: '5101', name: 'Salary & Wages', groupCode: 'OE', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5102', name: 'Rent', groupCode: 'OE', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5103', name: 'Electricity & Utilities', groupCode: 'OE', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5104', name: 'Depreciation', groupCode: 'OE', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5105', name: 'Repairs & Maintenance', groupCode: 'OE', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5106', name: 'Office Expenses', groupCode: 'OE', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5107', name: 'Selling & Distribution', groupCode: 'OE', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5108', name: 'Professional Fees', groupCode: 'OE', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5109', name: 'Discount Allowed', groupCode: 'OE', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5110', name: 'Freight & Transport', groupCode: 'OE', nature: 'DEBIT', type: 'EXPENSE' },
  // Finance Expenses
  { code: '5201', name: 'Bank Charges', groupCode: 'FE', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5202', name: 'Interest on Loans', groupCode: 'FE', nature: 'DEBIT', type: 'EXPENSE' },
  // Tax Expenses
  { code: '5301', name: 'Income Tax', groupCode: 'TE', nature: 'DEBIT', type: 'EXPENSE' },
  { code: '5302', name: 'Deferred Tax', groupCode: 'TE', nature: 'DEBIT', type: 'EXPENSE' },
];

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async seedDefaultCoa(companyId: string, userId: string) {
    const existing = await this.prisma.accountGroup.count({ where: { companyId } });
    if (existing > 0) return { message: 'COA already seeded', groups: existing };

    // Create groups
    const groupMap: Record<string, string> = {};
    for (const g of DEFAULT_GROUPS) {
      const group = await this.prisma.accountGroup.create({
        data: { ...g, companyId, isSystemGroup: true, createdBy: userId, updatedBy: userId },
      });
      groupMap[g.code] = group.id;
    }

    // Create accounts
    let accountCount = 0;
    for (const a of DEFAULT_ACCOUNTS) {
      const { groupCode, ...accountData } = a;
      const groupId = groupMap[groupCode];
      if (!groupId) continue;
      await this.prisma.accountHead.create({
        data: { ...accountData, groupId, companyId, isSystemAccount: true, createdBy: userId, updatedBy: userId },
      });
      accountCount++;
    }

    await this.audit.log({ tableName: 'account_groups', recordId: companyId, action: 'CREATE', newValues: { seeded: true }, changedBy: userId });
    return { message: 'COA seeded successfully', groups: DEFAULT_GROUPS.length, accounts: accountCount };
  }

  async createGroup(dto: CreateGroupDto, user: any) {
    const existing = await this.prisma.accountGroup.findUnique({ where: { companyId_code: { companyId: user.companyId, code: dto.code } } });
    if (existing) throw new BadRequestException(`Group code ${dto.code} already exists`);
    const group = await this.prisma.accountGroup.create({ data: { ...dto, companyId: user.companyId, createdBy: user.id, updatedBy: user.id } });
    await this.audit.log({ tableName: 'account_groups', recordId: group.id, action: 'CREATE', newValues: group, changedBy: user.id });
    return group;
  }

  async updateGroup(id: string, dto: any, user: any) {
    const group = await this.prisma.accountGroup.findFirst({ where: { id, companyId: user.companyId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.isSystemGroup) throw new BadRequestException('Cannot edit system group');
    return this.prisma.accountGroup.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
  }

  async findAllGroups(user: any) {
    return this.prisma.accountGroup.findMany({
      where: { companyId: user.companyId, isActive: true },
      include: { parentGroup: { select: { name: true, code: true } }, _count: { select: { accounts: true, childGroups: true } } },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });
  }

  async createAccount(dto: CreateAccountDto, user: any) {
    const existing = await this.prisma.accountHead.findUnique({ where: { companyId_code: { companyId: user.companyId, code: dto.code } } });
    if (existing) throw new BadRequestException(`Account code ${dto.code} already exists`);
    const group = await this.prisma.accountGroup.findFirst({ where: { id: dto.groupId, companyId: user.companyId } });
    if (!group) throw new NotFoundException('Account group not found');

    const account = await this.prisma.accountHead.create({
      data: {
        ...dto, companyId: user.companyId,
        type: group.type, nature: group.nature,
        currentBalance: dto.openingBalance || 0,
        createdBy: user.id, updatedBy: user.id,
      },
      include: { group: { select: { name: true, code: true, type: true } } },
    });
    await this.audit.log({ tableName: 'account_heads', recordId: account.id, action: 'CREATE', newValues: account, changedBy: user.id });
    return account;
  }

  async updateAccount(id: string, dto: any, user: any) {
    const account = await this.prisma.accountHead.findFirst({ where: { id, companyId: user.companyId } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.isSystemAccount && dto.code) throw new BadRequestException('Cannot change code of system account');
    const updated = await this.prisma.accountHead.update({ where: { id }, data: { ...dto, updatedBy: user.id }, include: { group: { select: { name: true } } } });
    await this.audit.log({ tableName: 'account_heads', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAllAccounts(user: any, query: any) {
    const { type, groupId, search, isBankAccount, page = 1, limit = 100 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId, isActive: true };
    if (type) where.type = type;
    if (groupId) where.groupId = groupId;
    if (isBankAccount === 'true') where.isBankAccount = true;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }];

    const [data, total] = await Promise.all([
      this.prisma.accountHead.findMany({
        where, skip, take: Number(limit),
        include: { group: { select: { name: true, code: true, type: true } } },
        orderBy: { code: 'asc' },
      }),
      this.prisma.accountHead.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getAccount(id: string, user: any) {
    const account = await this.prisma.accountHead.findFirst({
      where: { id, companyId: user.companyId },
      include: { group: { select: { name: true, code: true, type: true, nature: true } } },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async getStats(user: any) {
    const [totalGroups, totalAccounts, byType] = await Promise.all([
      this.prisma.accountGroup.count({ where: { companyId: user.companyId, isActive: true } }),
      this.prisma.accountHead.count({ where: { companyId: user.companyId, isActive: true } }),
      this.prisma.accountHead.groupBy({ by: ['type'], where: { companyId: user.companyId, isActive: true }, _count: { id: true } }),
    ]);
    const isSeeded = totalGroups > 0;
    return { totalGroups, totalAccounts, byType, isSeeded };
  }
}
