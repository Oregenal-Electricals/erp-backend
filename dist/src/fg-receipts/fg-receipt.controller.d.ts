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
                productCode: string;
                productName: string;
                plannedQty: number;
                completedQty: number;
                woNumber: string;
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
            remarks: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            warehouseId: string;
            unitCost: number;
            totalCost: number;
            receivedQty: number;
            rejectedQty: number;
            batchNumber: string | null;
            plannedQty: number;
            workOrderId: string;
            receiptNumber: string;
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
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
            woNumber: string;
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
        remarks: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        receivedQty: number;
        rejectedQty: number;
        batchNumber: string | null;
        plannedQty: number;
        workOrderId: string;
        receiptNumber: string;
    }>;
    create(dto: CreateFgReceiptDto, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
            woNumber: string;
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
        remarks: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        receivedQty: number;
        rejectedQty: number;
        batchNumber: string | null;
        plannedQty: number;
        workOrderId: string;
        receiptNumber: string;
    }>;
    createFromWo(woId: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
            woNumber: string;
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
        remarks: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        receivedQty: number;
        rejectedQty: number;
        batchNumber: string | null;
        plannedQty: number;
        workOrderId: string;
        receiptNumber: string;
    }>;
    confirm(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
            woNumber: string;
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
        remarks: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        receivedQty: number;
        rejectedQty: number;
        batchNumber: string | null;
        plannedQty: number;
        workOrderId: string;
        receiptNumber: string;
    }>;
}
