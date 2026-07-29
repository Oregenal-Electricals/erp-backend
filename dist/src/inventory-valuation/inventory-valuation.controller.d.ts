import { InventoryValuationService } from './inventory-valuation.service';
export declare class InventoryValuationController {
    private readonly ivService;
    constructor(ivService: InventoryValuationService);
    getSummary(req: any, query: any): Promise<{
        grandTotal: number;
        totalItems: number;
        zeroStockItems: number;
        activeItems: number;
        byWarehouse: any[];
    }>;
    getAging(req: any, query: any): Promise<{
        data: any[];
        buckets: any[];
        totalValue: any;
    }>;
    getSlowMoving(req: any, query: any): Promise<{
        data: any[];
        totalItems: number;
        totalValue: any;
        days: number;
    }>;
    getFifoValue(req: any, query: any): Promise<{
        data: any[];
        totalFifoValue: any;
        totalItems: number;
    }>;
}
