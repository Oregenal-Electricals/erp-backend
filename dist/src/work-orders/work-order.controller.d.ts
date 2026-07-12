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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            priority: string;
            remarks: string | null;
            uom: string;
            warehouseId: string;
            bomId: string | null;
            rejectedQty: number;
            productCode: string;
            productName: string;
            plannedQty: number;
            plannedStartDate: Date;
            plannedEndDate: Date;
            completedQty: number;
            actualStartDate: Date | null;
            actualEndDate: Date | null;
            woNumber: string;
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
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                isActive: boolean;
                isTestData: boolean;
                companyId: string;
                quantity: number;
                itemCode: string;
                itemName: string;
                itemType: string;
                uom: string;
                notes: string | null;
                sequence: number;
                rawMaterialId: string | null;
                wastagePercent: number | null;
                unitCost: number | null;
                isCritical: boolean;
                totalCost: number | null;
                bomId: string;
                effectiveQty: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            description: string | null;
            status: string;
            productId: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            revisionId: string | null;
            version: string;
            effectiveFrom: Date;
            effectiveTo: Date | null;
            bomNumber: string;
            totalCost: number | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
    }>;
}
