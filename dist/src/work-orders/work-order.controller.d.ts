import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto';
export declare class WorkOrderController {
    private readonly woService;
    constructor(woService: WorkOrderService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        released: number;
        inProgress: number;
        completed: number;
        cancelled: number;
        totalPlanned: number;
        totalCompleted: number;
        totalRejected: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            warehouse: {
                name: string;
                code: string;
            };
            bom: {
                status: string;
                bomNumber: string;
                version: string;
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
            plannedQty: number;
            completedQty: number;
            plannedStartDate: Date;
            plannedEndDate: Date;
            actualStartDate: Date | null;
            actualEndDate: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            items: {
                id: string;
                companyId: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                quantity: number;
                itemCode: string;
                itemName: string;
                itemType: string;
                uom: string;
                notes: string | null;
                totalCost: number | null;
                bomId: string;
                sequence: number;
                rawMaterialId: string | null;
                wastagePercent: number | null;
                effectiveQty: number;
                unitCost: number | null;
                isCritical: boolean;
            }[];
        } & {
            id: string;
            companyId: string;
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            productId: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            bomNumber: string;
            version: string;
            effectiveFrom: Date;
            effectiveTo: Date | null;
            totalCost: number | null;
            revisionId: string | null;
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
        plannedQty: number;
        completedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
    }>;
    create(dto: CreateWorkOrderDto, req: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            bomNumber: string;
            version: string;
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
        plannedQty: number;
        completedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
    }>;
    update(id: string, dto: UpdateWorkOrderDto, req: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            bomNumber: string;
            version: string;
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
        plannedQty: number;
        completedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
    }>;
    release(id: string, req: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            bomNumber: string;
            version: string;
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
        plannedQty: number;
        completedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
    }>;
    start(id: string, req: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            bomNumber: string;
            version: string;
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
        plannedQty: number;
        completedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
    }>;
    complete(id: string, dto: any, req: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            bomNumber: string;
            version: string;
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
        plannedQty: number;
        completedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
    }>;
    cancel(id: string, req: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            bomNumber: string;
            version: string;
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
        plannedQty: number;
        completedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
    }>;
}
