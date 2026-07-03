import { PrismaService } from '../prisma/prisma.service';
export declare class FinancialReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getPeriodDates;
    getTrialBalance(user: any, query: any): Promise<{
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
    getProfitAndLoss(user: any, query: any): Promise<{
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
    getBalanceSheet(user: any, query: any): Promise<{
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
    getCashFlow(user: any, query: any): Promise<{
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
    getSummary(user: any): Promise<{
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
}
