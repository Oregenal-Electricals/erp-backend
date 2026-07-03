import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getExecutive(req: any): Promise<{
        kpis: {
            revenueMTD: number;
            revenuePrev: number;
            revenueGrowth: number;
            arOutstanding: number;
            arCount: number;
            apOutstanding: number;
            apCount: number;
            pendingApprovals: number;
            openTasks: number;
            lowStockItems: number;
        };
        orderPipeline: Record<string, number>;
        purchasePipeline: Record<string, number>;
        ncrSummary: Record<string, number>;
        revenueTrend: any[];
        topCustomers: {
            name: string;
            revenue: number;
        }[];
        recentOrders: {
            createdAt: Date;
            status: string;
            customerName: string;
            totalAmount: number;
            soNumber: string;
        }[];
    }>;
    getSales(req: any): Promise<{
        salesTrend: any[];
        topCustomers: {
            name: string;
            revenue: number;
            invoices: number;
        }[];
        soByStatus: {};
        dispatchRate: number;
        totalDispatched: number;
        totalDelivered: number;
    }>;
    getPurchase(req: any): Promise<{
        purchaseTrend: any[];
        topVendors: {
            name: string;
            spend: number;
            pos: number;
        }[];
        poByStatus: {};
    }>;
    getInventory(req: any): Promise<{
        totalItems: number;
        totalQty: number;
        totalValue: number;
        lowStockCount: number;
        zeroStockCount: number;
        lowStockItems: {
            itemCode: string;
            itemName: string;
            availableQty: number;
            warehouse: any;
        }[];
        byWarehouse: {
            warehouse: string;
            value: number;
            qty: number;
            items: number;
        }[];
    }>;
    getQuality(req: any): Promise<{
        ncrTrend: any[];
        ncrBySource: {};
        ncrBySeverity: {};
        ncrByStatus: {};
        capa: {
            open: number;
            closed: number;
            overdue: number;
        };
    }>;
    getFinance(req: any): Promise<{
        plTrend: any[];
        arAging: {
            bucket: string;
            amount: number;
            count: number;
        }[];
    }>;
}
