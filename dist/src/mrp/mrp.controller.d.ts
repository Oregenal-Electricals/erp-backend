import { MrpService } from './mrp.service';
export declare class MrpController {
    private readonly mrpService;
    constructor(mrpService: MrpService);
    calculate(woId: string, req: any): Promise<{
        workOrder: {
            id: string;
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
            status: string;
            warehouse: string;
        };
        bom: {
            bomNumber: string;
            version: string;
        };
        requirements: any[];
        summary: {
            totalComponents: number;
            availableComponents: number;
            shortageComponents: number;
            noStockComponents: number;
            hasShortage: boolean;
            canProduce: boolean;
        };
    }>;
    shortageReport(req: any): Promise<{
        data: any[];
        totalWOs: number;
        wosWithShortage: number;
    }>;
    materialPlan(req: any, query: any): Promise<{
        data: any[];
        totalWOs: number;
        totalItems: number;
    }>;
    planningBoard(req: any, warehouseId: string): Promise<any[]>;
    runAllocation(dto: any, req: any): Promise<{
        feasible: boolean;
        shortages: any[];
        createdWorkOrders: any[];
    } | {
        feasible: boolean;
        shortages: any[];
        createdWorkOrders: any[];
    }>;
}
