import { FinancialReportsService } from './financial-reports.service';
export declare class FinancialReportsController {
    private readonly frService;
    constructor(frService: FinancialReportsService);
    getSummary(req: any): Promise<{
        period: string;
        revenue: number;
        grossProfit: number;
        netProfit: number;
        grossMarginPct: number;
        netMarginPct: number;
        totalAssets: number;
        totalLiabilities: number;
        cashBalance: number;
        arOutstanding: number;
        arCount: number;
        apOutstanding: number;
        apCount: number;
    }>;
    getTrialBalance(req: any, query: any): Promise<{
        fromDate: Date;
        toDate: Date;
        rows: {
            accountCode: string;
            accountName: string;
            accountType: string;
            accountSubType: string;
            openingBalance: number;
            periodDebit: number;
            periodCredit: number;
            closingBalance: number;
        }[];
        totalDebit: number;
        totalCredit: number;
        isBalanced: boolean;
    }>;
    getProfitAndLoss(req: any, query: any): Promise<{
        fromDate: Date;
        toDate: Date;
        income: {
            accountCode: string;
            accountName: string;
            accountSubType: string;
            amount: number;
        }[];
        cogs: {
            accountCode: string;
            accountName: string;
            accountSubType: string;
            amount: number;
        }[];
        opex: {
            accountCode: string;
            accountName: string;
            accountSubType: string;
            amount: number;
        }[];
        totalIncome: number;
        totalCogs: number;
        grossProfit: number;
        totalOpex: number;
        netProfit: number;
        grossMarginPct: number;
        netMarginPct: number;
    }>;
    getBalanceSheet(req: any, query: any): Promise<{
        asOf: Date;
        assets: {
            items: {
                accountCode: string;
                accountName: string;
                accountSubType: string;
                balance: number;
            }[];
            total: number;
        };
        liabilities: {
            items: {
                accountCode: string;
                accountName: string;
                accountSubType: string;
                balance: number;
            }[];
            total: number;
        };
        equity: {
            items: {
                accountCode: string;
                accountName: string;
                balance: number;
            }[];
            total: number;
            retainedEarnings: number;
        };
        totalLiabilitiesAndEquity: number;
        isBalanced: boolean;
    }>;
    getCashFlow(req: any, query: any): Promise<{
        fromDate: Date;
        toDate: Date;
        openingBalance: number;
        receipts: {
            amount: number;
            voucherNumber: string;
            voucherType: string;
            date: Date;
            party: string;
        }[];
        payments: {
            amount: number;
            voucherNumber: string;
            voucherType: string;
            date: Date;
            party: string;
        }[];
        totalReceipts: number;
        totalPayments: number;
        netCashFlow: number;
        closingBalance: number;
        bankAccounts: {
            name: string;
            balance: number;
        }[];
    }>;
}
