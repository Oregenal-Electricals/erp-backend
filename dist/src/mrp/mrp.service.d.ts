import { PrismaService } from '../prisma/prisma.service';
export declare class MrpService {
    private prisma;
    constructor(prisma: PrismaService);
    calculateMrp(woId: string, user: any): Promise<{
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
    getShortageReport(user: any): Promise<{
        data: any[];
        totalWOs: number;
        wosWithShortage: number;
    }>;
    getMaterialPlan(user: any, query: any): Promise<{
        data: any[];
        totalWOs: number;
        totalItems: number;
    }>;
}
