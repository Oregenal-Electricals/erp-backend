import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateFgReceiptDto } from './dto/fg-receipt.dto';
export declare class FgReceiptService {
    private prisma;
    private audit;
    private stockLedger;
    constructor(prisma: PrismaService, audit: AuditService, stockLedger: StockLedgerService);
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
            plannedQty: number;
            completedQty: number;
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
    create(dto: CreateFgReceiptDto, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
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
        batchNumber: string | null;
        plannedQty: number;
        workOrderId: string;
        receiptNumber: string;
    }>;
    confirm(id: string, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
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
        batchNumber: string | null;
        plannedQty: number;
        workOrderId: string;
        receiptNumber: string;
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
                plannedQty: number;
                completedQty: number;
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
    findOne(id: string, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
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
        batchNumber: string | null;
        plannedQty: number;
        workOrderId: string;
        receiptNumber: string;
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
