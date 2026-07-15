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
    getPurchaseDeep(companyId: string, query: any): Promise<{
        kpis: {
            totalSpend: number;
            totalPos: number;
            avgPoValue: number;
            paymentRate: number;
            apOutstanding: number;
            totalGrns: number;
            pendingGrns: number;
        };
        purchaseTrend: any[];
        topVendors: {
            name: string;
            code: string;
            spend: number;
            pos: number;
        }[];
        poByStatus: {
            [k: string]: number;
        };
        apAging: {
            current: number;
            days1_30: number;
            days31_60: number;
            days61_90: number;
            over90: number;
        };
    }>;
    getInventoryDeep(companyId: string): Promise<{
        kpis: {
            totalItems: number;
            totalValue: number;
            totalQty: number;
            lowStockCount: number;
            zeroStockCount: number;
        };
        topByValue: {
            itemCode: string;
            itemName: string;
            warehouse: any;
            availableQty: number;
            unitCost: number;
            totalValue: number;
        }[];
        byWarehouse: {
            name: string;
            value: number;
            qty: number;
            items: number;
        }[];
        lowStockItems: {
            itemCode: string;
            itemName: string;
            availableQty: number;
            warehouse: any;
            unitCost: number;
        }[];
        zeroStockItems: {
            itemCode: string;
            itemName: string;
            warehouse: any;
        }[];
        movementTrend: any[];
    }>;
    getProductionDeep(companyId: string): Promise<{
        kpis: {
            total: number;
            completed: number;
            inProgress: number;
            cancelled: number;
            draft: number;
            completionRate: number;
            rejectionRate: number;
            avgCycleHours: number;
            totalPlanned: number;
            totalCompleted: number;
            totalRejected: number;
        };
        productionTrend: any[];
        woByStatus: {
            [k: string]: number;
        };
        topProducts: {
            productCode: string;
            productName: string;
            completedQty: number;
            wos: number;
        }[];
        overdueWos: {
            status: string;
            priority: string;
            woNumber: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
            plannedEndDate: Date;
        }[];
    }>;
    getQualityDeep(companyId: string): Promise<{
        kpis: {
            ncrTotal: number;
            ncrOpen: number;
            ncrClosed: number;
            ncrCritical: number;
            capaTotal: number;
            capaCompleted: number;
            capaOverdue: number;
            capaCompletionRate: number;
            oqcTotal: number;
            oqcPassed: number;
            oqcFailed: number;
            oqcPassRate: number;
            qualityScore: number;
        };
        ncrTrend: any[];
        bySource: {
            [k: string]: number;
        };
        bySeverity: {
            [k: string]: number;
        };
        byStatus: {
            [k: string]: number;
        };
        capaByStatus: {
            [k: string]: number;
        };
        topDefectItems: {
            itemName: string;
            count: number;
        }[];
    }>;
    getFinanceDeep(companyId: string): Promise<{
        kpis: {
            totalRevenue: number;
            totalExpense: number;
            grossProfit: number;
            profitMargin: number;
            arOutstanding: number;
            arCount: number;
            apOutstanding: number;
            apCount: number;
            bankBalance: number;
            outputGst: number;
            inputGst: number;
            netGst: number;
            totalVouchers: number;
            postedVouchers: number;
        };
        plTrend: any[];
        arAging: {
            current: number;
            days1_30: number;
            days31_60: number;
            days61_90: number;
            over90: number;
        };
        apAging: {
            current: number;
            days1_30: number;
            days31_60: number;
            days61_90: number;
            over90: number;
        };
    }>;
}
