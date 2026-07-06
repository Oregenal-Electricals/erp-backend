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
            status: string;
            createdAt: Date;
            totalAmount: number;
            customerName: string;
            soNumber: string;
        }[];
        invoices: {
            status: string;
            outstandingAmount: number;
            subtotal: number;
            totalGst: number;
            totalAmount: number;
            invoiceNumber: string;
            customerName: string;
            invoiceDate: Date;
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
            totalAmount: number;
            deliveryDate: Date;
            poDate: Date;
            vendor: {
                name: string;
            };
            poNumber: string;
        }[];
        bills: {
            status: string;
            outstandingAmount: number;
            subtotal: number;
            totalGst: number;
            totalAmount: number;
            billNumber: string;
            vendorName: string;
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
            dueDate: Date;
            status: string;
            outstandingAmount: number;
            totalAmount: number;
            invoiceNumber: string;
            customerName: string;
            invoiceDate: Date;
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
            dueDate: Date;
            status: string;
            outstandingAmount: number;
            totalAmount: number;
            billNumber: string;
            vendorName: string;
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
            status: string;
            ncrNumber: string;
            source: string;
            itemCode: string;
            itemName: string;
            description: string;
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
            subtotal: number;
            totalGst: number;
            invoiceNumber: string;
            customerName: string;
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
