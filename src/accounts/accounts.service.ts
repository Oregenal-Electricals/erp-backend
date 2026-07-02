import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

const DEFAULT_ACCOUNTS = [
  // ASSETS
  { code:'1000', name:'Cash & Bank', type:'ASSET', subType:'CASH', parent:null },
  { code:'1001', name:'Cash in Hand', type:'ASSET', subType:'CASH', parent:'1000' },
  { code:'1002', name:'Bank Account - HDFC', type:'ASSET', subType:'BANK', parent:'1000' },
  { code:'1003', name:'Bank Account - SBI', type:'ASSET', subType:'BANK', parent:'1000' },
  { code:'1100', name:'Accounts Receivable', type:'ASSET', subType:'DEBTOR', parent:null },
  { code:'1101', name:'Trade Debtors', type:'ASSET', subType:'DEBTOR', parent:'1100' },
  { code:'1200', name:'Inventory', type:'ASSET', subType:'STOCK', parent:null },
  { code:'1201', name:'Raw Material Stock', type:'ASSET', subType:'STOCK', parent:'1200' },
  { code:'1202', name:'WIP Stock', type:'ASSET', subType:'STOCK', parent:'1200' },
  { code:'1203', name:'Finished Goods Stock', type:'ASSET', subType:'STOCK', parent:'1200' },
  { code:'1300', name:'Fixed Assets', type:'ASSET', subType:'FIXED_ASSET', parent:null },
  { code:'1301', name:'Plant & Machinery', type:'ASSET', subType:'FIXED_ASSET', parent:'1300' },
  { code:'1302', name:'Furniture & Fixtures', type:'ASSET', subType:'FIXED_ASSET', parent:'1300' },
  // LIABILITIES
  { code:'2000', name:'Accounts Payable', type:'LIABILITY', subType:'CREDITOR', parent:null },
  { code:'2001', name:'Trade Creditors', type:'LIABILITY', subType:'CREDITOR', parent:'2000' },
  { code:'2100', name:'GST Liabilities', type:'LIABILITY', subType:'GST', parent:null },
  { code:'2101', name:'CGST Payable', type:'LIABILITY', subType:'GST', parent:'2100' },
  { code:'2102', name:'SGST Payable', type:'LIABILITY', subType:'GST', parent:'2100' },
  { code:'2103', name:'IGST Payable', type:'LIABILITY', subType:'GST', parent:'2100' },
  { code:'2104', name:'CGST Receivable', type:'ASSET', subType:'GST', parent:'2100' },
  { code:'2105', name:'SGST Receivable', type:'ASSET', subType:'GST', parent:'2100' },
  { code:'2106', name:'IGST Receivable', type:'ASSET', subType:'GST', parent:'2100' },
  { code:'2200', name:'Other Liabilities', type:'LIABILITY', subType:'OTHER', parent:null },
  { code:'2201', name:'TDS Payable', type:'LIABILITY', subType:'OTHER', parent:'2200' },
  // EQUITY
  { code:'3000', name:'Equity', type:'EQUITY', subType:'OTHER', parent:null },
  { code:'3001', name:'Share Capital', type:'EQUITY', subType:'OTHER', parent:'3000' },
  { code:'3002', name:'Retained Earnings', type:'EQUITY', subType:'OTHER', parent:'3000' },
  // INCOME
  { code:'4000', name:'Revenue', type:'INCOME', subType:'REVENUE', parent:null },
  { code:'4001', name:'Sales Revenue', type:'INCOME', subType:'REVENUE', parent:'4000' },
  { code:'4002', name:'Other Income', type:'INCOME', subType:'REVENUE', parent:'4000' },
  // EXPENSES
  { code:'5000', name:'Cost of Goods Sold', type:'EXPENSE', subType:'COGS', parent:null },
  { code:'5001', name:'Raw Material Cost', type:'EXPENSE', subType:'COGS', parent:'5000' },
  { code:'5002', name:'Labour Cost', type:'EXPENSE', subType:'COGS', parent:'5000' },
  { code:'5003', name:'Manufacturing Overhead', type:'EXPENSE', subType:'COGS', parent:'5000' },
  { code:'6000', name:'Operating Expenses', type:'EXPENSE', subType:'OPEX', parent:null },
  { code:'6001', name:'Salaries & Wages', type:'EXPENSE', subType:'OPEX', parent:'6000' },
  { code:'6002', name:'Rent', type:'EXPENSE', subType:'OPEX', parent:'6000' },
  { code:'6003', name:'Utilities', type:'EXPENSE', subType:'OPEX', parent:'6000' },
  { code:'6004', name:'Transport & Freight', type:'EXPENSE', subType:'OPEX', parent:'6000' },
  { code:'6005', name:'Bank Charges', type:'EXPENSE', subType:'OPEX', parent:'6000' },
  { code:'6006', name:'Depreciation', type:'EXPENSE', subType:'OPEX', parent:'6000' },
];

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async seedDefaultAccounts(companyId: string, userId: string) {
    const existing = await this.prisma.account.count({ where: { companyId } });
    if (existing > 0) return { message: 'Accounts already seeded', count: existing };

    // First pass: create parent accounts
    const codeToId: Record<string, string> = {};
    for (const acc of DEFAULT_ACCOUNTS.filter(a => !a.parent)) {
      const created = await this.prisma.account.create({
        data: {
          accountCode: acc.code, accountName: acc.name,
          accountType: acc.type, accountSubType: acc.subType,
          isSystemAccount: true, companyId, createdBy: userId, updatedBy: userId,
        },
      });
      codeToId[acc.code] = created.id;
    }
    // Second pass: create child accounts
    for (const acc of DEFAULT_ACCOUNTS.filter(a => a.parent)) {
      const created = await this.prisma.account.create({
        data: {
          accountCode: acc.code, accountName: acc.name,
          accountType: acc.type, accountSubType: acc.subType,
          parentId: codeToId[acc.parent],
          isSystemAccount: true, companyId, createdBy: userId, updatedBy: userId,
        },
      });
      codeToId[acc.code] = created.id;
    }
    return { message: 'Default accounts seeded', count: DEFAULT_ACCOUNTS.length };
  }

  async create(dto: CreateAccountDto, user: any) {
    const existing = await this.prisma.account.findUnique({ where: { companyId_accountCode: { companyId: user.companyId, accountCode: dto.accountCode } } });
    if (existing) throw new BadRequestException(`Account code ${dto.accountCode} already exists`);

    if (dto.parentId) {
      const parent = await this.prisma.account.findFirst({ where: { id: dto.parentId, companyId: user.companyId } });
      if (!parent) throw new NotFoundException('Parent account not found');
    }

    const account = await this.prisma.account.create({
      data: {
        accountCode: dto.accountCode, accountName: dto.accountName,
        accountType: dto.accountType, accountSubType: dto.accountSubType,
        parentId: dto.parentId, openingBalance: dto.openingBalance || 0,
        currentBalance: dto.openingBalance || 0,
        description: dto.description,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'accounts', recordId: account.id, action: 'CREATE', newValues: account, changedBy: user.id });
    return account;
  }

  async update(id: string, dto: UpdateAccountDto, user: any) {
    const account = await this.prisma.account.findFirst({ where: { id, companyId: user.companyId } });
    if (!account) throw new NotFoundException('Account not found');

    const updated = await this.prisma.account.update({ where: { id }, data: { ...dto, updatedBy: user.id } });
    await this.audit.log({ tableName: 'accounts', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { search, accountType, accountSubType } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (search) where.OR = [
      { accountCode: { contains: search, mode: 'insensitive' } },
      { accountName: { contains: search, mode: 'insensitive' } },
    ];
    if (accountType) where.accountType = accountType;
    if (accountSubType) where.accountSubType = accountSubType;

    const accounts = await this.prisma.account.findMany({
      where, orderBy: { accountCode: 'asc' },
      include: { parent: { select: { accountCode: true, accountName: true } }, _count: { select: { children: true } } },
    });
    return { data: accounts, total: accounts.length };
  }

  async getTree(user: any) {
    const accounts = await this.prisma.account.findMany({
      where: { companyId: user.companyId, isActive: true },
      orderBy: { accountCode: 'asc' },
    });
    // Build tree
    const map: Record<string, any> = {};
    const roots: any[] = [];
    accounts.forEach(a => { map[a.id] = { ...a, children: [] }; });
    accounts.forEach(a => {
      if (a.parentId && map[a.parentId]) map[a.parentId].children.push(map[a.id]);
      else roots.push(map[a.id]);
    });
    return roots;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId, isActive: true };
    const [total, assets, liabilities, equity, income, expense] = await Promise.all([
      this.prisma.account.count({ where }),
      this.prisma.account.count({ where: { ...where, accountType: 'ASSET' } }),
      this.prisma.account.count({ where: { ...where, accountType: 'LIABILITY' } }),
      this.prisma.account.count({ where: { ...where, accountType: 'EQUITY' } }),
      this.prisma.account.count({ where: { ...where, accountType: 'INCOME' } }),
      this.prisma.account.count({ where: { ...where, accountType: 'EXPENSE' } }),
    ]);
    return { total, assets, liabilities, equity, income, expense };
  }

  async findOne(id: string, user: any) {
    const account = await this.prisma.account.findFirst({
      where: { id, companyId: user.companyId },
      include: { parent: { select: { accountCode: true, accountName: true } }, children: true },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }
}
