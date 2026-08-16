import { MisReportsService } from './mis-reports.service';
export declare class MisReportsController {
    private readonly misService;
    constructor(misService: MisReportsService);
    getSalesSummary(req: any, query: any): Promise<{
        reportType: string;
        period: {
            from: Date;
            to: Date;
        };
        summary: {
            totalOrders: number;
            totalInvoices: number;
            totalRevenue: number;
            totalOutstanding: number;
            totalDispatches: number;
        };
        salesOrders: {
            createdAt: Date;
            status: string;
            customerName: string;
            totalAmount: number;
            soNumber: string;
        }[];
        invoices: {
            status: string;
            customerName: string;
            subtotal: number;
            totalGst: number;
            totalAmount: number;
            invoiceNumber: string;
            invoiceDate: Date;
            outstandingAmount: number;
        }[];
    }>;
    getPurchaseSummary(req: any, query: any): Promise<{
        reportType: string;
        period: {
            from: Date;
            to: Date;
        };
        summary: {
            totalPos: number;
            totalBills: number;
            totalSpend: number;
            totalOutstanding: number;
            totalGrns: number;
        };
        purchaseOrders: {
            vendorName: string;
            status: string;
            vendor: {
                name: string;
            };
            poDate: Date;
            deliveryDate: Date;
            totalAmount: number;
            poNumber: string;
        }[];
        bills: {
            status: string;
            subtotal: number;
            totalGst: number;
            totalAmount: number;
            outstandingAmount: number;
            billNumber: string;
            vendorName: string;
            billDate: Date;
        }[];
    }>;
    getStockPosition(req: any, query: any): Promise<{
        reportType: string;
        asOf: Date;
        summary: {
            totalItems: number;
            totalValue: number;
            totalQty: number;
            lowStock: number;
            zeroStock: number;
        };
        items: {
            itemCode: string;
            itemName: string;
            warehouse: any;
            availableQty: number;
            reservedQty: number;
            unitCost: number;
            totalValue: number;
        }[];
    }>;
    getOutstandingAr(req: any, query: any): Promise<{
        reportType: string;
        asOf: Date;
        summary: {
            totalInvoices: number;
            totalOutstanding: number;
            overdueAmount: number;
            overdueCount: number;
        };
        items: {
            daysOverdue: number;
            isOverdue: boolean;
            status: string;
            customerName: string;
            totalAmount: number;
            invoiceNumber: string;
            invoiceDate: Date;
            dueDate: Date;
            outstandingAmount: number;
        }[];
    }>;
    getOutstandingAp(req: any, query: any): Promise<{
        reportType: string;
        asOf: Date;
        summary: {
            totalBills: number;
            totalOutstanding: number;
            overdueCount: number;
        };
        items: {
            daysOverdue: number;
            isOverdue: boolean;
            status: string;
            totalAmount: number;
            dueDate: Date;
            outstandingAmount: number;
            billNumber: string;
            vendorName: string;
            billDate: Date;
        }[];
    }>;
    getNcrSummary(req: any, query: any): Promise<{
        reportType: string;
        period: {
            from: Date;
            to: Date;
        };
        summary: {
            total: number;
            bySeverity: {};
            byStatus: {};
        };
        items: {
            description: string;
            status: string;
            itemCode: string;
            itemName: string;
            severity: string;
            ncrNumber: string;
            source: string;
            detectedDate: Date;
        }[];
    }>;
    getProductionSummary(req: any, query: any): Promise<{
        reportType: string;
        period: {
            from: Date;
            to: Date;
        };
        summary: {
            totalWos: number;
            totalPlanned: number;
            totalCompleted: number;
            totalRejected: number;
            completionRate: number;
            byStatus: {};
        };
        items: {
            status: string;
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
            rejectedQty: number;
            plannedStartDate: Date;
            plannedEndDate: Date;
            actualStartDate: Date;
            actualEndDate: Date;
        }[];
    }>;
    getGstSummary(req: any, query: any): Promise<{
        reportType: string;
        period: {
            from: Date;
            to: Date;
        };
        summary: {
            outputGst: number;
            inputGst: number;
            netGst: number;
            netPayable: number;
            excessCredit: number;
            salesCount: number;
            purchaseCount: number;
        };
        salesData: {
            customerName: string;
            subtotal: number;
            totalGst: number;
            invoiceNumber: string;
            invoiceDate: Date;
        }[];
        purchaseData: {
            subtotal: number;
            totalGst: number;
            billNumber: string;
            vendorName: string;
            billDate: Date;
        }[];
    }>;
}
