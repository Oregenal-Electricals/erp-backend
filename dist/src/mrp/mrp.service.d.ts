import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { MaterialReservationService } from '../work-orders/material-reservation.service';
export declare class MrpService {
    private prisma;
    private audit;
    private materialReservation;
    constructor(prisma: PrismaService, audit: AuditService, materialReservation: MaterialReservationService);
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
    getPlanningBoard(user: any, warehouseId: string): Promise<any[]>;
    runAllocation(dto: {
        warehouseId: string;
        allocations: {
            soItemId: string;
            buildQty: number;
        }[];
    }, user: any): Promise<{
        feasible: boolean;
        shortages: any[];
        createdWorkOrders: any[];
    } | {
        feasible: boolean;
        shortages: any[];
        createdWorkOrders: any[];
    }>;
    private generateWoNumber;
}
