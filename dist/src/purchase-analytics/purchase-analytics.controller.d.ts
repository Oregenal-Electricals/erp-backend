import { PurchaseAnalyticsService } from './purchase-analytics.service';
export declare class PurchaseAnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: PurchaseAnalyticsService);
    getOverview(req: any): Promise<{
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
    getSpendByVendor(req: any, limit?: string): Promise<any[]>;
    getSpendByMonth(req: any): Promise<{
        month: string;
        amount: number;
    }[]>;
    getPoStatusDistribution(req: any): Promise<{
        status: string;
        count: number;
    }[]>;
    getPrToPoTime(req: any): Promise<{
        avgCycleDays: number;
        cycles: {
            poNumber: string;
            prNumber: string;
            cycleDays: number;
        }[];
    }>;
    getRfqConversion(req: any): Promise<{
        totalRfqs: number;
        closedRfqs: number;
        totalPos: number;
        posWithRfq: number;
        conversionRate: number;
        rfqUtilization: number;
    }>;
    getTopItems(req: any, limit?: string): Promise<any[]>;
}
