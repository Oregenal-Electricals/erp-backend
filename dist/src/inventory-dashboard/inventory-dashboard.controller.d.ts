import { InventoryDashboardService } from './inventory-dashboard.service';
export declare class InventoryDashboardController {
    private readonly idService;
    constructor(idService: InventoryDashboardService);
    getOverview(req: any): Promise<{
        totalItems: number;
        totalWarehouses: number;
        totalBatches: number;
        totalStockValue: number;
        pendingGrns: number;
        pendingIqc: number;
        pendingPutaway: number;
        today: {
            receipts: number;
            issues: number;
            transfers: number;
        };
        month: {
            receipts: number;
            issues: number;
        };
    }>;
    getAlerts(req: any): Promise<{
        lowStock: {
            itemCode: string;
            itemName: string;
            availableQty: number;
        }[];
        expiringBatches: {
            itemCode: string;
            itemName: string;
            availableQty: number;
            batchNumber: string;
            expiryDate: Date;
        }[];
        expiredBatches: number;
        pendingGrns: {
            createdAt: Date;
            status: string;
            grnNumber: string;
        }[];
        pendingIqc: {
            createdAt: Date;
            iqcNumber: string;
        }[];
        quarantinedBatches: number;
    }>;
    getActivity(req: any): Promise<({
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
    })[]>;
    getTopItems(req: any): Promise<{
        data: {
            stockValue: number;
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
            itemCode: string;
            itemName: string;
            warehouseId: string;
            availableQty: number;
            reservedQty: number;
            inQcQty: number;
            unitCost: number;
            totalValue: number;
            lastUpdated: Date;
        }[];
        totalValue: number;
    }>;
}
