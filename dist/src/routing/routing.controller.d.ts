import { RoutingService } from './routing.service';
import { CreateRoutingDto, StartProductionDto } from './dto/routing.dto';
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
            bomId: string;
            stageName: string;
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
            bomId: string;
            stageName: string;
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
        bomId: string | null;
        rejectedQty: number;
        woNumber: string;
        productCode: string;
        productName: string;
        salesOrderId: string | null;
        routingGroupId: string | null;
        stageSequence: number | null;
        parentWorkOrderId: string | null;
        plannedQty: number;
        completedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
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
            bomId: string;
            stageName: string;
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
    startProduction(dto: StartProductionDto, req: any): Promise<{
        routingGroupId: string;
        stages: any[];
    }>;
}
