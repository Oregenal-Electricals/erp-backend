import { InventoryReportsService } from './inventory-reports.service';
export declare class InventoryReportsController {
    private readonly irService;
    constructor(irService: InventoryReportsService);
    getStockRegister(req: any, query: any): Promise<{
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
    getGrnRegister(req: any, query: any): Promise<{
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
    getIssueRegister(req: any, query: any): Promise<{
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
    getTransferRegister(req: any, query: any): Promise<{
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
    getAbcAnalysis(req: any, query: any): Promise<{
        data: any[];
        totalItems: number;
        grandTotal: any;
        aItems: number;
        bItems: number;
        cItems: number;
    }>;
}
