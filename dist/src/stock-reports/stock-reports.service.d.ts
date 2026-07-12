import { PrismaService } from '../prisma/prisma.service';
export declare class StockReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getLedger(user: any, query: any): Promise<{
        data: ({
            warehouse: {
                code: string;
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
            referenceType: string | null;
            referenceId: string | null;
            referenceNumber: string | null;
            transactionType: string;
            inQty: number;
            outQty: number;
            balanceQty: number;
            transactionDate: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getBalanceSummary(user: any, query: any): Promise<{
        data: ({
            warehouse: {
                code: string;
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
            itemCode: string;
            itemName: string;
            warehouseId: string;
            unitCost: number;
            totalValue: number;
            availableQty: number;
            reservedQty: number;
            inQcQty: number;
            lastUpdated: Date;
        })[];
        totalItems: number;
        totalValue: number;
        lowStockItems: number;
    }>;
    getItemCard(itemCode: string, user: any, query: any): Promise<{
        itemCode: string;
        balances: ({
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
            itemCode: string;
            itemName: string;
            warehouseId: string;
            unitCost: number;
            totalValue: number;
            availableQty: number;
            reservedQty: number;
            inQcQty: number;
            lastUpdated: Date;
        })[];
        movements: {
            runningBalance: number;
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
            remarks: string | null;
            itemCode: string;
            itemName: string;
            warehouseId: string;
            unitCost: number;
            totalCost: number;
            referenceType: string | null;
            referenceId: string | null;
            referenceNumber: string | null;
            transactionType: string;
            inQty: number;
            outQty: number;
            balanceQty: number;
            transactionDate: Date;
        }[];
        batches: ({
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
            status: string;
            remarks: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            warehouseId: string;
            unitCost: number;
            expiryDate: Date | null;
            receivedDate: Date;
            grnId: string | null;
            grnItemId: string | null;
            availableQty: number;
            reservedQty: number;
            lotNumber: string | null;
            mfgDate: Date | null;
            originalQty: number;
            batchNumber: string;
        })[];
        summary: {
            totalIn: number;
            totalOut: number;
            netMovement: number;
            currentBalance: number;
        };
    }>;
    getBatchMovements(user: any, query: any): Promise<{
        data: ({
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
            status: string;
            remarks: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            warehouseId: string;
            unitCost: number;
            expiryDate: Date | null;
            receivedDate: Date;
            grnId: string | null;
            grnItemId: string | null;
            availableQty: number;
            reservedQty: number;
            lotNumber: string | null;
            mfgDate: Date | null;
            originalQty: number;
            batchNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getConsumptionReport(user: any, query: any): Promise<{
        data: any[];
        totalValue: any;
        totalItems: number;
    }>;
}
