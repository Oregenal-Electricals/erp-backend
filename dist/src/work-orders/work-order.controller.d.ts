import { WorkOrderService } from './work-order.service';
import { MaterialReservationService } from './material-reservation.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto';
export declare class WorkOrderController {
    private readonly woService;
    private readonly reservationService;
    constructor(woService: WorkOrderService, reservationService: MaterialReservationService);
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
    getReservations(req: any, query: any): Promise<({
        workOrder: {
            status: string;
            priority: string;
            woNumber: string;
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
        itemCode: string;
        itemName: string;
        warehouseId: string;
        reservedQty: number;
        releasedReason: string | null;
        workOrderId: string;
    })[]>;
    findAll(req: any, query: any): Promise<{
        data: ({
            warehouse: {
                name: string;
                code: string;
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
                itemCode: string;
                itemName: string;
                uom: string;
                quantity: number;
                notes: string | null;
                itemType: string;
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
            productId: string;
            revisionId: string | null;
            version: string;
            effectiveFrom: Date;
            effectiveTo: Date | null;
            bomNumber: string;
            totalCost: number | null;
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
    getWoReservations(id: string): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        itemCode: string;
        itemName: string;
        warehouseId: string;
        reservedQty: number;
        releasedReason: string | null;
        workOrderId: string;
    }[]>;
    create(dto: CreateWorkOrderDto, req: any): Promise<{
        warehouse: {
            name: string;
            code: string;
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
        materialReservations: any[];
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            version: string;
            bomNumber: string;
        };
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
