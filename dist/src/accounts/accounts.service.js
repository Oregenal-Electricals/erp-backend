"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const DEFAULT_ACCOUNTS = [
    { code: '1000', name: 'Cash & Bank', type: 'ASSET', subType: 'CASH', parent: null },
    { code: '1001', name: 'Cash in Hand', type: 'ASSET', subType: 'CASH', parent: '1000' },
    { code: '1002', name: 'Bank Account - HDFC', type: 'ASSET', subType: 'BANK', parent: '1000' },
    { code: '1003', name: 'Bank Account - SBI', type: 'ASSET', subType: 'BANK', parent: '1000' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET', subType: 'DEBTOR', parent: null },
    { code: '1101', name: 'Trade Debtors', type: 'ASSET', subType: 'DEBTOR', parent: '1100' },
    { code: '1200', name: 'Inventory', type: 'ASSET', subType: 'STOCK', parent: null },
    { code: '1201', name: 'Raw Material Stock', type: 'ASSET', subType: 'STOCK', parent: '1200' },
    { code: '1202', name: 'WIP Stock', type: 'ASSET', subType: 'STOCK', parent: '1200' },
    { code: '1203', name: 'Finished Goods Stock', type: 'ASSET', subType: 'STOCK', parent: '1200' },
    { code: '1300', name: 'Fixed Assets', type: 'ASSET', subType: 'FIXED_ASSET', parent: null },
    { code: '1301', name: 'Plant & Machinery', type: 'ASSET', subType: 'FIXED_ASSET', parent: '1300' },
    { code: '1302', name: 'Furniture & Fixtures', type: 'ASSET', subType: 'FIXED_ASSET', parent: '1300' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subType: 'CREDITOR', parent: null },
    { code: '2001', name: 'Trade Creditors', type: 'LIABILITY', subType: 'CREDITOR', parent: '2000' },
    { code: '2100', name: 'GST Liabilities', type: 'LIABILITY', subType: 'GST', parent: null },
    { code: '2101', name: 'CGST Payable', type: 'LIABILITY', subType: 'GST', parent: '2100' },
    { code: '2102', name: 'SGST Payable', type: 'LIABILITY', subType: 'GST', parent: '2100' },
    { code: '2103', name: 'IGST Payable', type: 'LIABILITY', subType: 'GST', parent: '2100' },
    { code: '2104', name: 'CGST Receivable', type: 'ASSET', subType: 'GST', parent: '2100' },
    { code: '2105', name: 'SGST Receivable', type: 'ASSET', subType: 'GST', parent: '2100' },
    { code: '2106', name: 'IGST Receivable', type: 'ASSET', subType: 'GST', parent: '2100' },
    { code: '2200', name: 'Other Liabilities', type: 'LIABILITY', subType: 'OTHER', parent: null },
    { code: '2201', name: 'TDS Payable', type: 'LIABILITY', subType: 'OTHER', parent: '2200' },
    { code: '3000', name: 'Equity', type: 'EQUITY', subType: 'OTHER', parent: null },
    { code: '3001', name: 'Share Capital', type: 'EQUITY', subType: 'OTHER', parent: '3000' },
    { code: '3002', name: 'Retained Earnings', type: 'EQUITY', subType: 'OTHER', parent: '3000' },
    { code: '4000', name: 'Revenue', type: 'INCOME', subType: 'REVENUE', parent: null },
    { code: '4001', name: 'Sales Revenue', type: 'INCOME', subType: 'REVENUE', parent: '4000' },
    { code: '4002', name: 'Other Income', type: 'INCOME', subType: 'REVENUE', parent: '4000' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', subType: 'COGS', parent: null },
    { code: '5001', name: 'Raw Material Cost', type: 'EXPENSE', subType: 'COGS', parent: '5000' },
    { code: '5002', name: 'Labour Cost', type: 'EXPENSE', subType: 'COGS', parent: '5000' },
    { code: '5003', name: 'Manufacturing Overhead', type: 'EXPENSE', subType: 'COGS', parent: '5000' },
    { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', subType: 'OPEX', parent: null },
    { code: '6001', name: 'Salaries & Wages', type: 'EXPENSE', subType: 'OPEX', parent: '6000' },
    { code: '6002', name: 'Rent', type: 'EXPENSE', subType: 'OPEX', parent: '6000' },
    { code: '6003', name: 'Utilities', type: 'EXPENSE', subType: 'OPEX', parent: '6000' },
    { code: '6004', name: 'Transport & Freight', type: 'EXPENSE', subType: 'OPEX', parent: '6000' },
    { code: '6005', name: 'Bank Charges', type: 'EXPENSE', subType: 'OPEX', parent: '6000' },
    { code: '6006', name: 'Depreciation', type: 'EXPENSE', subType: 'OPEX', parent: '6000' },
];
let AccountsService = class AccountsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async seedDefaultAccounts(companyId, userId) {
        const existing = await this.prisma.account.count({ where: { companyId } });
        if (existing > 0)
            return { message: 'Accounts already seeded', count: existing };
        const codeToId = {};
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
    async create(dto, user) {
        const existing = await this.prisma.account.findUnique({ where: { companyId_accountCode: { companyId: user.companyId, accountCode: dto.accountCode } } });
        if (existing)
            throw new common_1.BadRequestException(`Account code ${dto.accountCode} already exists`);
        if (dto.parentId) {
            const parent = await this.prisma.account.findFirst({ where: { id: dto.parentId, companyId: user.companyId } });
            if (!parent)
                throw new common_1.NotFoundException('Parent account not found');
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
    async update(id, dto, user) {
        const account = await this.prisma.account.findFirst({ where: { id, companyId: user.companyId } });
        if (!account)
            throw new common_1.NotFoundException('Account not found');
        const updated = await this.prisma.account.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'accounts', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { search, accountType, accountSubType } = query;
        const where = { companyId: user.companyId, isActive: true };
        if (search)
            where.OR = [
                { accountCode: { contains: search, mode: 'insensitive' } },
                { accountName: { contains: search, mode: 'insensitive' } },
            ];
        if (accountType)
            where.accountType = accountType;
        if (accountSubType)
            where.accountSubType = accountSubType;
        const accounts = await this.prisma.account.findMany({
            where, orderBy: { accountCode: 'asc' },
            include: { parent: { select: { accountCode: true, accountName: true } }, _count: { select: { children: true } } },
        });
        return { data: accounts, total: accounts.length };
    }
    async getTree(user) {
        const accounts = await this.prisma.account.findMany({
            where: { companyId: user.companyId, isActive: true },
            orderBy: { accountCode: 'asc' },
        });
        const map = {};
        const roots = [];
        accounts.forEach(a => { map[a.id] = Object.assign(Object.assign({}, a), { children: [] }); });
        accounts.forEach(a => {
            if (a.parentId && map[a.parentId])
                map[a.parentId].children.push(map[a.id]);
            else
                roots.push(map[a.id]);
        });
        return roots;
    }
    async getStats(user) {
        const where = { companyId: user.companyId, isActive: true };
        const [total, assets, liabilities, equity, income, expense] = await Promise.all([
            this.prisma.account.count({ where }),
            this.prisma.account.count({ where: Object.assign(Object.assign({}, where), { accountType: 'ASSET' }) }),
            this.prisma.account.count({ where: Object.assign(Object.assign({}, where), { accountType: 'LIABILITY' }) }),
            this.prisma.account.count({ where: Object.assign(Object.assign({}, where), { accountType: 'EQUITY' }) }),
            this.prisma.account.count({ where: Object.assign(Object.assign({}, where), { accountType: 'INCOME' }) }),
            this.prisma.account.count({ where: Object.assign(Object.assign({}, where), { accountType: 'EXPENSE' }) }),
        ]);
        return { total, assets, liabilities, equity, income, expense };
    }
    async findOne(id, user) {
        const account = await this.prisma.account.findFirst({
            where: { id, companyId: user.companyId },
            include: { parent: { select: { accountCode: true, accountName: true } }, children: true },
        });
        if (!account)
            throw new common_1.NotFoundException('Account not found');
        return account;
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map