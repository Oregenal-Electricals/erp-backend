import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkOrderService } from '../work-orders/work-order.service';
import { CreateRoutingDto, StartProductionDto } from './dto/routing.dto';
export declare class RoutingService {
    private prisma;
    private audit;
    private workOrderService;
    constructor(prisma: PrismaService, audit: AuditService, workOrderService: WorkOrderService);
    createRouting(dto: CreateRoutingDto, user: any): Promise<{
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
    findAll(user: any): Promise<({
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
    findOne(id: string, user: any): Promise<{
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
    startProduction(dto: StartProductionDto, user: any): Promise<{
        routingGroupId: string;
        stages: any[];
    }>;
    getChain(routingGroupId: string, user: any): Promise<({
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
}
