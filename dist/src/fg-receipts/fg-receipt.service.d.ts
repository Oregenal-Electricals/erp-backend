import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkOrderService } from '../work-orders/work-order.service';
import { CreateFgReceiptDto, CreateFgReceiptFromQcDto } from './dto/fg-receipt.dto';
export declare class FgReceiptService {
    private prisma;
    private audit;
    private workOrderService;
    constructor(prisma: PrismaService, audit: AuditService, workOrderService: WorkOrderService);
    private generateNumber;
    private includes;
    createFromWo(workOrderId: string, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
            plannedQty: number;
            completedQty: number;
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
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        receivedQty: number;
        rejectedQty: number;
        plannedQty: number;
        workOrderId: string;
        batchNumber: string | null;
        receiptNumber: string;
        sourceProductionQcId: string | null;
    }>;
    createFromQcAcceptance(dto: CreateFgReceiptFromQcDto, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
            plannedQty: number;
            completedQty: number;
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
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        receivedQty: number;
        rejectedQty: number;
        plannedQty: number;
        workOrderId: string;
        batchNumber: string | null;
        receiptNumber: string;
        sourceProductionQcId: string | null;
    }>;
    create(dto: CreateFgReceiptDto, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
            plannedQty: number;
            completedQty: number;
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
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        receivedQty: number;
        rejectedQty: number;
        plannedQty: number;
        workOrderId: string;
        batchNumber: string | null;
        receiptNumber: string;
        sourceProductionQcId: string | null;
    }>;
    confirm(id: string, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
            plannedQty: number;
            completedQty: number;
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
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        receivedQty: number;
        rejectedQty: number;
        plannedQty: number;
        workOrderId: string;
        batchNumber: string | null;
        receiptNumber: string;
        sourceProductionQcId: string | null;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            warehouse: {
                name: string;
                code: string;
            };
            workOrder: {
                productCode: string;
                productName: string;
                woNumber: string;
                plannedQty: number;
                completedQty: number;
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
            itemCode: string;
            itemName: string;
            uom: string;
            warehouseId: string;
            unitCost: number;
            totalCost: number;
            receivedQty: number;
            rejectedQty: number;
            plannedQty: number;
            workOrderId: string;
            batchNumber: string | null;
            receiptNumber: string;
            sourceProductionQcId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
            plannedQty: number;
            completedQty: number;
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
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        receivedQty: number;
        rejectedQty: number;
        plannedQty: number;
        workOrderId: string;
        batchNumber: string | null;
        receiptNumber: string;
        sourceProductionQcId: string | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        received: number;
        totalReceivedQty: number;
        totalValue: number;
    }>;
    getCompletedWosWithoutFgr(user: any): Promise<{
        data: any[];
        total: number;
    }>;
}
