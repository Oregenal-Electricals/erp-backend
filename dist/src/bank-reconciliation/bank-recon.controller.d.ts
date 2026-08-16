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
            voucherType: string;
            voucherDate: Date;
            partyName: string;
            voucherNumber: string;
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
        amount: number;
        accountId: string;
        entryType: string;
        narration: string | null;
        voucherId: string;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
    findOne(id: string, req: any): Promise<{
        lines: {
            id: string;
            companyId: string;
            description: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
    create(dto: CreateBankStatementDto, req: any): Promise<{
        lines: {
            id: string;
            companyId: string;
            description: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
