import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryDashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getOverview(user: any): Promise<{
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
    getAlerts(user: any): Promise<{
        lowStock: {
            itemCode: string;
            itemName: string;
            availableQty: number;
        }[];
        expiringBatches: {
            itemCode: string;
            itemName: string;
            expiryDate: Date;
            availableQty: number;
            batchNumber: string;
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
    getActivity(user: any): Promise<({
        warehouse: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        remarks: string | null;
        itemCode: string;
        itemName: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        transactionType: string;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        inQty: number;
        outQty: number;
        balanceQty: number;
        transactionDate: Date;
    })[]>;
    getTopItems(user: any): Promise<{
        data: {
            stockValue: number;
            warehouse: {
                name: string;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            itemCode: string;
            itemName: string;
            warehouseId: string;
            unitCost: number;
            totalValue: number;
            availableQty: number;
            reservedQty: number;
            inQcQty: number;
            lastUpdated: Date;
        }[];
        totalValue: number;
    }>;
}
