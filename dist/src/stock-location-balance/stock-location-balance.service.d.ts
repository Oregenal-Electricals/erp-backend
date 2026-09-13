import { PrismaService } from '../prisma/prisma.service';
export declare class StockLocationBalanceService {
    private prisma;
    constructor(prisma: PrismaService);
    adjustQty(params: {
        companyId: string;
        itemCode: string;
        itemName: string;
        warehouseId: string;
        binId: string;
        batchId?: string | null;
        status?: string;
        deltaQty: number;
        userId: string;
    }): Promise<number>;
    consumeAcrossBins(companyId: string, itemCode: string, batchId: string | null, qtyNeeded: number, userId: string, status?: string): Promise<number>;
    getBalance(companyId: string, itemCode: string, binId: string, batchId: string | null, status?: string): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        itemCode: string;
        itemName: string;
        qty: number;
        warehouseId: string;
        batchId: string | null;
        binId: string;
    }>;
    getByBin(companyId: string, binId: string): Promise<({
        batch: {
            batchNumber: string;
            expiryDate: Date;
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
        itemCode: string;
        itemName: string;
        qty: number;
        warehouseId: string;
        batchId: string | null;
        binId: string;
    })[]>;
    getByItem(companyId: string, itemCode: string): Promise<({
        bin: {
            code: string;
            rackId: string;
        };
        batch: {
            batchNumber: string;
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
        itemCode: string;
        itemName: string;
        qty: number;
        warehouseId: string;
        batchId: string | null;
        binId: string;
    })[]>;
}
