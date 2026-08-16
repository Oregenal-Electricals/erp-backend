import { RoutingService } from './routing.service';
import { CreateRoutingDto } from './dto/routing.dto';
export declare class RoutingController {
    private readonly routingService;
    constructor(routingService: RoutingService);
    findAll(req: any): Promise<({
        finalProduct: {
            name: string;
            code: string;
        };
        stages: ({
            bom: {
                bomNumber: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            warehouseId: string | null;
            bomId: string;
            stageName: string;
            sequence: number;
            routingId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        finalProductId: string;
        routingName: string;
    })[]>;
    findOne(id: string, req: any): Promise<{
        finalProduct: {
            name: string;
            code: string;
        };
        stages: ({
            bom: {
                bomNumber: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            warehouseId: string | null;
            bomId: string;
            stageName: string;
            sequence: number;
            routingId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        warehouseId: string;
        woNumber: string;
        productCode: string;
        productName: string;
        uom: string;
        bomId: string | null;
        salesOrderId: string | null;
        routingGroupId: string | null;
        stageSequence: number | null;
        stageName: string | null;
        parentWorkOrderId: string | null;
        plannedQty: number;
        completedQty: number;
        rejectedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        priority: string;
    })[]>;
    create(dto: CreateRoutingDto, req: any): Promise<{
        finalProduct: {
            name: string;
            code: string;
        };
        stages: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            warehouseId: string | null;
            bomId: string;
            stageName: string;
            sequence: number;
            routingId: string;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        finalProductId: string;
        routingName: string;
    }>;
}
