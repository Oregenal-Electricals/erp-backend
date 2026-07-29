import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    private dateWhere;
    getStockRegister(user: any, query: any): Promise<{
        data: {
            itemCode: string;
            itemName: string;
            warehouse: string;
            availableQty: number;
            reservedQty: number;
            unitCost: number;
            stockValue: number;
        }[];
        totalItems: number;
        totalValue: number;
        totalQty: number;
    }>;
    getGrnRegister(user: any, query: any): Promise<{
        data: {
            grnNumber: any;
            grnType: any;
            status: any;
            warehouse: any;
            totalItems: any;
            totalReceivedQty: any;
            totalAcceptedQty: any;
            totalRejectedQty: any;
            totalValue: any;
            date: any;
        }[];
        totalGrns: number;
        totalValue: any;
    }>;
    getIssueRegister(user: any, query: any): Promise<{
        data: {
            issueNumber: string;
            issuedTo: string;
            referenceType: string;
            issueMethod: string;
            warehouse: string;
            totalItems: number;
            totalQty: number;
            totalValue: number;
            date: Date;
        }[];
        totalIssues: number;
        totalValue: number;
        totalQty: number;
    }>;
    getTransferRegister(user: any, query: any): Promise<{
        data: {
            transferNumber: string;
            transferType: string;
            fromWarehouse: string;
            toWarehouse: string;
            totalItems: number;
            totalQty: number;
            totalValue: number;
            date: Date;
        }[];
        totalTransfers: number;
        totalValue: number;
    }>;
    getAbcAnalysis(user: any, query: any): Promise<{
        data: any[];
        totalItems: number;
        grandTotal: any;
        aItems: number;
        bItems: number;
        cItems: number;
    }>;
}
