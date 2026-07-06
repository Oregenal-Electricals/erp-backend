import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateBankStatementDto, ReconcileLineDto } from './dto/bank-recon.dto';
export declare class BankReconService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    create(dto: CreateBankStatementDto, user: any): Promise<{
        lines: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            description: string;
            referenceNumber: string | null;
            transactionDate: Date;
            balance: number;
            debitAmount: number;
            creditAmount: number;
            voucherEntryId: string | null;
            isReconciled: boolean;
            reconciledDate: Date | null;
            reconciledBy: string | null;
            statementId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        remarks: string | null;
        period: string;
        openingBalance: number;
        bankAccountId: string;
        bankAccountName: string;
        closingBalance: number;
        totalCredits: number;
        totalDebits: number;
        reconciledCount: number;
        unreconciledCount: number;
    }>;
    reconcileLine(dto: ReconcileLineDto, user: any): Promise<{
        message: string;
        reconciledCount: number;
        unreconciledCount: number;
        status: string;
    }>;
    unreconcileLine(lineId: string, user: any): Promise<{
        message: string;
    }>;
    getSuggestions(lineId: string, user: any): Promise<({
        account: {
            accountCode: string;
            accountName: string;
        };
        voucher: {
            referenceNumber: string;
            voucherType: string;
            voucherDate: Date;
            partyName: string;
            voucherNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        amount: number;
        accountId: string;
        entryType: string;
        narration: string | null;
        voucherId: string;
    })[]>;
    findAll(user: any, query: any): Promise<({
        lines: {
            id: string;
            debitAmount: number;
            creditAmount: number;
            isReconciled: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        remarks: string | null;
        period: string;
        openingBalance: number;
        bankAccountId: string;
        bankAccountName: string;
        closingBalance: number;
        totalCredits: number;
        totalDebits: number;
        reconciledCount: number;
        unreconciledCount: number;
    })[]>;
    findOne(id: string, user: any): Promise<{
        lines: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            description: string;
            referenceNumber: string | null;
            transactionDate: Date;
            balance: number;
            debitAmount: number;
            creditAmount: number;
            voucherEntryId: string | null;
            isReconciled: boolean;
            reconciledDate: Date | null;
            reconciledBy: string | null;
            statementId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        remarks: string | null;
        period: string;
        openingBalance: number;
        bankAccountId: string;
        bankAccountName: string;
        closingBalance: number;
        totalCredits: number;
        totalDebits: number;
        reconciledCount: number;
        unreconciledCount: number;
    }>;
    getBankAccounts(user: any): Promise<{
        id: string;
        accountCode: string;
        accountName: string;
        currentBalance: number;
    }[]>;
    getStats(user: any): Promise<{
        total: number;
        reconciled: number;
        draft: number;
        unreconciledLines: number;
    }>;
}
