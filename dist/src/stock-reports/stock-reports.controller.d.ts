import { StockReportsService } from './stock-reports.service';
export declare class StockReportsController {
    private readonly srService;
    constructor(srService: StockReportsService);
    getLedger(req: any, query: any): Promise<{
        data: ({
            warehouse: {
                code: string;
                name: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            itemCode: string;
            itemName: string;
            warehouseId: string;
            unitCost: number;
            referenceType: string | null;
            referenceId: string | null;
            referenceNumber: string | null;
            transactionDate: Date;
            totalCost: number;
            inQty: number;
            outQty: number;
            balanceQty: number;
            transactionType: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getBalanceSummary(req: any, query: any): Promise<{
        data: ({
            warehouse: {
                code: string;
                name: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            warehouseId: string;
            availableQty: number;
            reservedQty: number;
            inQcQty: number;
            unitCost: number;
            totalValue: number;
            lastUpdated: Date;
        })[];
        totalItems: number;
        totalValue: number;
        lowStockItems: number;
    }>;
    getItemCard(itemCode: string, req: any, query: any): Promise<{
        itemCode: string;
        balances: ({
            warehouse: {
                name: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            warehouseId: string;
            availableQty: number;
            reservedQty: number;
            inQcQty: number;
            unitCost: number;
            totalValue: number;
            lastUpdated: Date;
        })[];
        movements: {
            runningBalance: number;
            warehouse: {
                name: string;
            };
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            itemCode: string;
            itemName: string;
            warehouseId: string;
            unitCost: number;
            referenceType: string | null;
            referenceId: string | null;
            referenceNumber: string | null;
            transactionDate: Date;
            totalCost: number;
            inQty: number;
            outQty: number;
            balanceQty: number;
            transactionType: string;
        }[];
        batches: ({
            warehouse: {
                name: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            itemCode: string;
            itemName: string;
            warehouseId: string;
            availableQty: number;
            reservedQty: number;
            unitCost: number;
            uom: string;
            batchNumber: string;
            receivedDate: Date;
            expiryDate: Date | null;
            lotNumber: string | null;
            grnId: string | null;
            grnItemId: string | null;
            mfgDate: Date | null;
            originalQty: number;
        })[];
        summary: {
            totalIn: number;
            totalOut: number;
            netMovement: number;
            currentBalance: number;
        };
    }>;
    getBatchMovements(req: any, query: any): Promise<{
        data: ({
            warehouse: {
                name: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            itemCode: string;
            itemName: string;
            warehouseId: string;
            availableQty: number;
            reservedQty: number;
            unitCost: number;
            uom: string;
            batchNumber: string;
            receivedDate: Date;
            expiryDate: Date | null;
            lotNumber: string | null;
            grnId: string | null;
            grnItemId: string | null;
            mfgDate: Date | null;
            originalQty: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getConsumption(req: any, query: any): Promise<{
        data: any[];
        totalValue: any;
        totalItems: number;
    }>;
}
