import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryValuationService {
    private prisma;
    constructor(prisma: PrismaService);
    getSummary(user: any, query: any): Promise<{
        grandTotal: number;
        totalItems: number;
        zeroStockItems: number;
        activeItems: number;
        byWarehouse: any[];
    }>;
    getAging(user: any, query: any): Promise<{
        data: any[];
        buckets: any[];
        totalValue: any;
    }>;
    getSlowMoving(user: any, query: any): Promise<{
        data: any[];
        totalItems: number;
        totalValue: any;
        days: number;
    }>;
    getFifoValue(user: any, query: any): Promise<{
        data: any[];
        totalFifoValue: any;
        totalItems: number;
    }>;
}
