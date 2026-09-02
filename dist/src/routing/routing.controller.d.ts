import { RoutingService } from './routing.service';
import { CreateRoutingDto } from './dto/routing.dto';
export declare class RoutingController {
    private readonly routingService;
    constructor(routingService: RoutingService);
    findAll(req: any): Promise<({
        stages: ({
            bom: {
                bomNumber: string;
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
            warehouseId: string | null;
            sequence: number;
            stageName: string;
            bomId: string;
            routingId: string;
        })[];
        finalProduct: {
            name: string;
            code: string;
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
        finalProductId: string;
        routingName: string;
    })[]>;
    findOne(id: string, req: any): Promise<{
        stages: ({
            bom: {
                bomNumber: string;
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
            warehouseId: string | null;
            sequence: number;
            stageName: string;
            bomId: string;
            routingId: string;
        })[];
        finalProduct: {
            name: string;
            code: string;
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
        finalProductId: string;
        routingName: string;
    }>;
    getChain(routingGroupId: string, req: any): Promise<({
        warehouse: {
            name: string;
        };
        bom: {
            bomNumber: string;
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
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        stageName: string | null;
        productCode: string;
        productName: string;
        bomId: string | null;
        requiredDate: Date | null;
        rejectedQty: number;
        woNumber: string;
        salesOrderId: string | null;
        routingGroupId: string | null;
        stageSequence: number | null;
        parentWorkOrderId: string | null;
        plannedQty: number;
        pendingReassignQty: number | null;
        completedQty: number;
        cumulativeInputQty: number;
        cumulativeProcessedQty: number;
        cumulativeHandoverQty: number;
        stageStatus: string;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        releasedById: string | null;
        releasedAt: Date | null;
        materialAvailability: string | null;
        plannedManpower: number | null;
        plannedLabourHours: number | null;
        plannedLabourCost: number | null;
        plannedLabourCostPerPc: number | null;
    })[]>;
    create(dto: CreateRoutingDto, req: any): Promise<{
        stages: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            warehouseId: string | null;
            sequence: number;
            stageName: string;
            bomId: string;
            routingId: string;
        }[];
        finalProduct: {
            name: string;
            code: string;
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
        finalProductId: string;
        routingName: string;
    }>;
}
