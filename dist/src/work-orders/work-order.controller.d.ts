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
                code: string;
                name: string;
            };
            bom: {
                status: string;
                version: string;
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
            remarks: string | null;
            warehouseId: string;
            woNumber: string;
            productCode: string;
            productName: string;
            uom: string;
            bomId: string | null;
            plannedQty: number;
            completedQty: number;
            rejectedQty: number;
            plannedStartDate: Date;
            plannedEndDate: Date;
            actualStartDate: Date | null;
            actualEndDate: Date | null;
            priority: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
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
                itemCode: string;
                itemName: string;
                unitCost: number | null;
                notes: string | null;
                uom: string;
                bomId: string;
                sequence: number;
                rawMaterialId: string | null;
                totalCost: number | null;
                itemType: string;
                quantity: number;
                wastagePercent: number | null;
                effectiveQty: number;
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
            approvedBy: string | null;
            approvedAt: Date | null;
            version: string;
            totalCost: number | null;
            productId: string;
            revisionId: string | null;
            bomNumber: string;
            effectiveFrom: Date;
            effectiveTo: Date | null;
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
        remarks: string | null;
        warehouseId: string;
        woNumber: string;
        productCode: string;
        productName: string;
        uom: string;
        bomId: string | null;
        plannedQty: number;
        completedQty: number;
        rejectedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        priority: string;
    }>;
    create(dto: CreateWorkOrderDto, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        bom: {
            status: string;
            version: string;
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
        remarks: string | null;
        warehouseId: string;
        woNumber: string;
        productCode: string;
        productName: string;
        uom: string;
        bomId: string | null;
        plannedQty: number;
        completedQty: number;
        rejectedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        priority: string;
    }>;
    update(id: string, dto: UpdateWorkOrderDto, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        bom: {
            status: string;
            version: string;
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
        remarks: string | null;
        warehouseId: string;
        woNumber: string;
        productCode: string;
        productName: string;
        uom: string;
        bomId: string | null;
        plannedQty: number;
        completedQty: number;
        rejectedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        priority: string;
    }>;
    release(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        bom: {
            status: string;
            version: string;
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
        remarks: string | null;
        warehouseId: string;
        woNumber: string;
        productCode: string;
        productName: string;
        uom: string;
        bomId: string | null;
        plannedQty: number;
        completedQty: number;
        rejectedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        priority: string;
    }>;
    start(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        bom: {
            status: string;
            version: string;
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
        remarks: string | null;
        warehouseId: string;
        woNumber: string;
        productCode: string;
        productName: string;
        uom: string;
        bomId: string | null;
        plannedQty: number;
        completedQty: number;
        rejectedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        priority: string;
    }>;
    complete(id: string, dto: any, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        bom: {
            status: string;
            version: string;
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
        remarks: string | null;
        warehouseId: string;
        woNumber: string;
        productCode: string;
        productName: string;
        uom: string;
        bomId: string | null;
        plannedQty: number;
        completedQty: number;
        rejectedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        priority: string;
    }>;
    cancel(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        bom: {
            status: string;
            version: string;
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
        remarks: string | null;
        warehouseId: string;
        woNumber: string;
        productCode: string;
        productName: string;
        uom: string;
        bomId: string | null;
        plannedQty: number;
        completedQty: number;
        rejectedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        priority: string;
    }>;
}
