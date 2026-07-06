import { BankReconService } from './bank-recon.service';
import { CreateBankStatementDto, ReconcileLineDto } from './dto/bank-recon.dto';
export declare class BankReconController {
    private readonly bankReconService;
    constructor(bankReconService: BankReconService);
    getStats(req: any): Promise<{
        total: number;
        reconciled: number;
        draft: number;
        unreconciledLines: number;
    }>;
    getBankAccounts(req: any): Promise<{
        id: string;
        accountCode: string;
        accountName: string;
        currentBalance: number;
    }[]>;
    getSuggestions(lineId: string, req: any): Promise<({
        account: {
            accountCode: string;
            accountName: string;
        };
        voucher: {
            referenceNumber: string;
            voucherNumber: string;
            voucherType: string;
            voucherDate: Date;
            partyName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        voucherId: string;
        amount: number;
        narration: string | null;
        entryType: string;
        accountId: string;
    })[]>;
    findAll(req: any, query: any): Promise<({
        lines: {
            id: string;
            debitAmount: number;
            creditAmount: number;
            isReconciled: boolean;
        }[];
    } & {
        id: string;
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        bankAccountId: string;
        openingBalance: number;
        period: string;
        bankAccountName: string;
        closingBalance: number;
        totalCredits: number;
        totalDebits: number;
        reconciledCount: number;
        unreconciledCount: number;
    })[]>;
    findOne(id: string, req: any): Promise<{
        lines: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            description: string;
            referenceNumber: string | null;
            statementId: string;
            transactionDate: Date;
            debitAmount: number;
            creditAmount: number;
            balance: number;
            isReconciled: boolean;
            voucherEntryId: string | null;
            reconciledDate: Date | null;
            reconciledBy: string | null;
        }[];
    } & {
        id: string;
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        bankAccountId: string;
        openingBalance: number;
        period: string;
        bankAccountName: string;
        closingBalance: number;
        totalCredits: number;
        totalDebits: number;
        reconciledCount: number;
        unreconciledCount: number;
    }>;
    create(dto: CreateBankStatementDto, req: any): Promise<{
        lines: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            description: string;
            referenceNumber: string | null;
            statementId: string;
            transactionDate: Date;
            debitAmount: number;
            creditAmount: number;
            balance: number;
            isReconciled: boolean;
            voucherEntryId: string | null;
            reconciledDate: Date | null;
            reconciledBy: string | null;
        }[];
    } & {
        id: string;
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        bankAccountId: string;
        openingBalance: number;
        period: string;
        bankAccountName: string;
        closingBalance: number;
        totalCredits: number;
        totalDebits: number;
        reconciledCount: number;
        unreconciledCount: number;
    }>;
    reconcile(dto: ReconcileLineDto, req: any): Promise<{
        message: string;
        reconciledCount: number;
        unreconciledCount: number;
        status: string;
    }>;
    unreconcile(lineId: string, req: any): Promise<{
        message: string;
    }>;
}
