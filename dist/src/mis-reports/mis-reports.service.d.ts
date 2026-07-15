import { PrismaService } from '../prisma/prisma.service';
export declare class MisReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getDateRange;
    getSalesSummary(companyId: string, query: any): Promise<{
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
            invoiceNumber: string;
            invoiceDate: Date;
            totalAmount: number;
            subtotal: number;
            totalGst: number;
            outstandingAmount: number;
        }[];
    }>;
    getPurchaseSummary(companyId: string, query: any): Promise<{
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
            poNumber: string;
            totalAmount: number;
            deliveryDate: Date;
            poDate: Date;
        }[];
        bills: {
            status: string;
            totalAmount: number;
            vendorName: string;
            subtotal: number;
            totalGst: number;
            outstandingAmount: number;
            billNumber: string;
            billDate: Date;
        }[];
    }>;
    getStockPosition(companyId: string, query: any): Promise<{
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
    getOutstandingAr(companyId: string, query: any): Promise<{
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
            dueDate: Date;
            customerName: string;
            invoiceNumber: string;
            invoiceDate: Date;
            totalAmount: number;
            outstandingAmount: number;
        }[];
    }>;
    getOutstandingAp(companyId: string, query: any): Promise<{
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
            dueDate: Date;
            totalAmount: number;
            vendorName: string;
            outstandingAmount: number;
            billNumber: string;
            billDate: Date;
        }[];
    }>;
    getNcrSummary(companyId: string, query: any): Promise<{
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
            ncrNumber: string;
            source: string;
            severity: string;
            detectedDate: Date;
        }[];
    }>;
    getProductionSummary(companyId: string, query: any): Promise<{
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
            rejectedQty: number;
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
            plannedStartDate: Date;
            plannedEndDate: Date;
            actualStartDate: Date;
            actualEndDate: Date;
        }[];
    }>;
    getGstSummary(companyId: string, query: any): Promise<{
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
            invoiceNumber: string;
            invoiceDate: Date;
            subtotal: number;
            totalGst: number;
        }[];
        purchaseData: {
            vendorName: string;
            subtotal: number;
            totalGst: number;
            billNumber: string;
            billDate: Date;
        }[];
    }>;
}
