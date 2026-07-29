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
exports.BankReconService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let BankReconService = class BankReconService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto, user) {
        const account = await this.prisma.account.findFirst({
            where: { id: dto.bankAccountId, companyId: user.companyId, accountSubType: 'BANK' },
        });
        if (!account)
            throw new common_1.NotFoundException('Bank account not found or not a BANK type account');
        const existing = await this.prisma.bankStatement.findUnique({
            where: { companyId_bankAccountId_period: { companyId: user.companyId, bankAccountId: dto.bankAccountId, period: dto.period } },
        });
        if (existing)
            throw new common_1.BadRequestException(`Bank statement already exists for ${dto.bankAccountName} - ${dto.period}`);
        const totalCredits = dto.lines.reduce((s, l) => s + (l.creditAmount || 0), 0);
        const totalDebits = dto.lines.reduce((s, l) => s + (l.debitAmount || 0), 0);
        const closingBalance = dto.openingBalance + totalCredits - totalDebits;
        const statement = await this.prisma.bankStatement.create({
            data: {
                bankAccountId: dto.bankAccountId, bankAccountName: dto.bankAccountName,
                period: dto.period, openingBalance: dto.openingBalance,
                closingBalance: Math.round(closingBalance * 100) / 100,
                totalCredits: Math.round(totalCredits * 100) / 100,
                totalDebits: Math.round(totalDebits * 100) / 100,
                unreconciledCount: dto.lines.length,
                remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                lines: {
                    create: dto.lines.map(l => ({
                        transactionDate: new Date(l.transactionDate),
                        description: l.description, referenceNumber: l.referenceNumber,
                        debitAmount: l.debitAmount || 0, creditAmount: l.creditAmount || 0,
                        balance: l.balance || 0,
                        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                    })),
                },
            },
            include: { lines: true },
        });
        await this.audit.log({ tableName: 'bank_statements', recordId: statement.id, action: 'CREATE', newValues: statement, changedBy: user.id });
        return statement;
    }
    async reconcileLine(dto, user) {
        const line = await this.prisma.bankStatementLine.findFirst({
            where: { id: dto.lineId, companyId: user.companyId },
            include: { statement: true },
        });
        if (!line)
            throw new common_1.NotFoundException('Bank statement line not found');
        if (line.isReconciled)
            throw new common_1.BadRequestException('Line already reconciled');
        await this.prisma.bankStatementLine.update({
            where: { id: dto.lineId },
            data: {
                isReconciled: true, voucherEntryId: dto.voucherEntryId,
                reconciledDate: new Date(), reconciledBy: user.id, updatedBy: user.id,
            },
        });
        const allLines = await this.prisma.bankStatementLine.findMany({ where: { statementId: line.statementId } });
        const reconciledCount = allLines.filter(l => l.isReconciled || l.id === dto.lineId).length;
        const unreconciledCount = allLines.length - reconciledCount;
        const newStatus = unreconciledCount === 0 ? 'RECONCILED' : 'DRAFT';
        await this.prisma.bankStatement.update({
            where: { id: line.statementId },
            data: { reconciledCount, unreconciledCount, status: newStatus, updatedBy: user.id },
        });
        return { message: 'Line reconciled', reconciledCount, unreconciledCount, status: newStatus };
    }
    async unreconcileLine(lineId, user) {
        const line = await this.prisma.bankStatementLine.findFirst({
            where: { id: lineId, companyId: user.companyId },
        });
        if (!line)
            throw new common_1.NotFoundException('Line not found');
        if (!line.isReconciled)
            throw new common_1.BadRequestException('Line not reconciled');
        await this.prisma.bankStatementLine.update({
            where: { id: lineId },
            data: { isReconciled: false, voucherEntryId: null, reconciledDate: null, reconciledBy: null, updatedBy: user.id },
        });
        const allLines = await this.prisma.bankStatementLine.findMany({ where: { statementId: line.statementId } });
        const reconciledCount = allLines.filter(l => l.isReconciled && l.id !== lineId).length;
        const unreconciledCount = allLines.length - reconciledCount;
        await this.prisma.bankStatement.update({
            where: { id: line.statementId },
            data: { reconciledCount, unreconciledCount, status: 'DRAFT', updatedBy: user.id },
        });
        return { message: 'Line unreconciled' };
    }
    async getSuggestions(lineId, user) {
        const line = await this.prisma.bankStatementLine.findFirst({ where: { id: lineId, companyId: user.companyId } });
        if (!line)
            throw new common_1.NotFoundException('Line not found');
        const amount = line.creditAmount > 0 ? line.creditAmount : line.debitAmount;
        const entryType = line.creditAmount > 0 ? 'DEBIT' : 'CREDIT';
        const suggestions = await this.prisma.voucherEntry.findMany({
            where: {
                companyId: user.companyId, amount: { gte: amount * 0.99, lte: amount * 1.01 }, entryType,
                voucher: { status: 'POSTED' },
            },
            include: { voucher: { select: { voucherNumber: true, voucherType: true, voucherDate: true, partyName: true, referenceNumber: true } }, account: { select: { accountCode: true, accountName: true } } },
            orderBy: { createdAt: 'desc' }, take: 10,
        });
        return suggestions;
    }
    async findAll(user, query) {
        const { period, bankAccountId } = query;
        const where = { companyId: user.companyId };
        if (period)
            where.period = period;
        if (bankAccountId)
            where.bankAccountId = bankAccountId;
        return this.prisma.bankStatement.findMany({
            where, orderBy: { period: 'desc' },
            include: { lines: { select: { id: true, isReconciled: true, debitAmount: true, creditAmount: true } } },
        });
    }
    async findOne(id, user) {
        const stmt = await this.prisma.bankStatement.findFirst({
            where: { id, companyId: user.companyId },
            include: { lines: { orderBy: { transactionDate: 'asc' } } },
        });
        if (!stmt)
            throw new common_1.NotFoundException('Bank statement not found');
        return stmt;
    }
    async getBankAccounts(user) {
        return this.prisma.account.findMany({
            where: { companyId: user.companyId, accountSubType: 'BANK', isActive: true },
            select: { id: true, accountCode: true, accountName: true, currentBalance: true },
        });
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [total, reconciled, draft] = await Promise.all([
            this.prisma.bankStatement.count({ where }),
            this.prisma.bankStatement.count({ where: Object.assign(Object.assign({}, where), { status: 'RECONCILED' }) }),
            this.prisma.bankStatement.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
        ]);
        const unreconciled = await this.prisma.bankStatementLine.count({ where: { companyId: user.companyId, isReconciled: false } });
        return { total, reconciled, draft, unreconciledLines: unreconciled };
    }
};
exports.BankReconService = BankReconService;
exports.BankReconService = BankReconService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], BankReconService);
//# sourceMappingURL=bank-recon.service.js.map