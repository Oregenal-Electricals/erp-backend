import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getPeriodDates;
    private getMonthLabel;
    getExecutiveDashboard(companyId: string): Promise<{
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
    getSalesAnalytics(companyId: string): Promise<{
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
    getPurchaseAnalytics(companyId: string): Promise<{
        purchaseTrend: any[];
        topVendors: {
            name: string;
            spend: number;
            pos: number;
        }[];
        poByStatus: {};
    }>;
    getInventoryAnalytics(companyId: string): Promise<{
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
    getQualityAnalytics(companyId: string): Promise<{
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
    getFinanceAnalytics(companyId: string): Promise<{
        plTrend: any[];
        arAging: {
            bucket: string;
            amount: number;
            count: number;
        }[];
    }>;
    getSalesDeep(companyId: string, query: any): Promise<{
        kpis: {
            totalRevenue: number;
            totalOrders: number;
            avgOrderValue: number;
            collectionRate: number;
            dispatchRate: number;
        };
        salesTrend: any[];
        funnel: {
            leads: number;
            quotes: number;
            cpos: number;
            sos: number;
            dispatches: number;
            deliveries: number;
        };
        topCustomers: {
            name: string;
            revenue: number;
            outstanding: number;
            invoices: number;
        }[];
        aging: {
            current: number;
            days1_30: number;
            days31_60: number;
            days61_90: number;
            over90: number;
        };
        soByStatus: {
            [k: string]: number;
        };
    }>;
}
