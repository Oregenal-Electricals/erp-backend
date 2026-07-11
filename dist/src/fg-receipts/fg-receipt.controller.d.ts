import { FgReceiptService } from './fg-receipt.service';
import { CreateFgReceiptDto } from './dto/fg-receipt.dto';
export declare class FgReceiptController {
    private readonly fgrService;
    constructor(fgrService: FgReceiptService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        received: number;
        totalReceivedQty: number;
        totalValue: number;
    }>;
    getPendingWos(req: any): Promise<{
        data: any[];
        total: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            warehouse: {
                code: string;
                name: string;
            };
            workOrder: {
                woNumber: string;
                productCode: string;
                productName: string;
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
            warehouseId: string;
            unitCost: number;
            uom: string;
            plannedQty: number;
            rejectedQty: number;
            batchNumber: string | null;
            receivedQty: number;
            workOrderId: string;
            receiptNumber: string;
            totalCost: number;
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
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
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
        warehouseId: string;
        unitCost: number;
        uom: string;
        plannedQty: number;
        rejectedQty: number;
        batchNumber: string | null;
        receivedQty: number;
        workOrderId: string;
        receiptNumber: string;
        totalCost: number;
    }>;
    create(dto: CreateFgReceiptDto, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
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
        warehouseId: string;
        unitCost: number;
        uom: string;
        plannedQty: number;
        rejectedQty: number;
        batchNumber: string | null;
        receivedQty: number;
        workOrderId: string;
        receiptNumber: string;
        totalCost: number;
    }>;
    createFromWo(woId: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
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
        warehouseId: string;
        unitCost: number;
        uom: string;
        plannedQty: number;
        rejectedQty: number;
        batchNumber: string | null;
        receivedQty: number;
        workOrderId: string;
        receiptNumber: string;
        totalCost: number;
    }>;
    confirm(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
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
        warehouseId: string;
        unitCost: number;
        uom: string;
        plannedQty: number;
        rejectedQty: number;
        batchNumber: string | null;
        receivedQty: number;
        workOrderId: string;
        receiptNumber: string;
        totalCost: number;
    }>;
}
