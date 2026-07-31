import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { MaterialReservationService } from '../work-orders/material-reservation.service';
import { RoutingService } from '../routing/routing.service';
export declare class MrpService {
    private prisma;
    private audit;
    private materialReservation;
    private routingService;
    constructor(prisma: PrismaService, audit: AuditService, materialReservation: MaterialReservationService, routingService: RoutingService);
    private findProducingBom;
    debugTree(user: any, itemCode: string): Promise<{
        itemCode: string;
        lowLevelCode: {
            [k: string]: number;
        };
        bomOfCount: number;
        bomOf: {
            [k: string]: number;
        };
        leavesOfRoot: string[];
        leavesOfRootCount: number;
    }>;
    private discoverBomTree;
    explodeMultiCpoMaterialNeeds(companyId: string, buckets: {
        bucketKey: string;
        itemCode: string;
        itemName: string;
        uom: string;
        qty: number;
    }[], bucketOrder: string[], warehouseId?: string): Promise<{
        levelZero: Map<string, Map<string, {
            requiredQty: number;
            availableQty: number;
            allocatedQty: number;
            netQty: number;
            hasBom: boolean;
        }>>;
        leafShortages: Map<string, {
            itemCode: string;
            itemName: string;
            uom: string;
            netRequired: number;
            availableQty: number;
            shortage: number;
            rawMaterialId: string | null;
        }[]>;
        leavesOf: Map<string, Set<string>>;
    }>;
    private explodeMaterialNeeds;
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
        shortages: {
            itemCode: string;
            itemName: string;
            uom: string;
            totalNeeded: number;
            available: number;
            shortfall: number;
        }[];
        createdWorkOrders: any[];
    } | {
        feasible: boolean;
        shortages: any[];
        createdWorkOrders: any[];
    }>;
    private generateWoNumber;
}
