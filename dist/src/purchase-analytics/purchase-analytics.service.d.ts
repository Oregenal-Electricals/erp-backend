import { PrismaService } from '../prisma/prisma.service';
export declare class PurchaseAnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getOverview(user: any): Promise<{
        totalPos: number;
        totalPoValue: number;
        approvedPoValue: number;
        monthlyPoValue: number;
        yearlyPoValue: number;
        totalPrValue: number;
        pendingPrs: number;
        pendingPos: number;
        sentPos: number;
        totalRfqs: number;
        totalVendorQuotations: number;
        totalAmendments: number;
    }>;
    getSpendByVendor(user: any, limit?: number): Promise<any[]>;
    getSpendByMonth(user: any): Promise<{
        month: string;
        amount: number;
    }[]>;
    getPoStatusDistribution(user: any): Promise<{
        status: string;
        count: number;
    }[]>;
    getPrToPoTime(user: any): Promise<{
        avgCycleDays: number;
        cycles: {
            poNumber: string;
            prNumber: string;
            cycleDays: number;
        }[];
    }>;
    getRfqConversion(user: any): Promise<{
        totalRfqs: number;
        closedRfqs: number;
        totalPos: number;
        posWithRfq: number;
        conversionRate: number;
        rfqUtilization: number;
    }>;
    getTopItems(user: any, limit?: number): Promise<any[]>;
}
