import { StockTransferService } from './stock-transfer.service';
import { CreateTransferDto } from './dto/stock-transfer.dto';
export declare class StockTransferController {
    private readonly stService;
    constructor(stService: StockTransferService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        confirmed: number;
        cancelled: number;
        byType: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.StockTransferGroupByOutputType, "transferType"[]> & {
            _count: number;
        })[];
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
            fromWarehouse: {
                name: string;
            };
            toWarehouse: {
                name: string;
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
            transferType: string;
            fromWarehouseId: string;
            toWarehouseId: string;
            fromBinId: string | null;
            toBinId: string | null;
            transferNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            qty: number;
            batchId: string | null;
            transferId: string;
        })[];
        fromWarehouse: {
            code: string;
            name: string;
        };
        toWarehouse: {
            code: string;
            name: string;
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
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
        transferNumber: string;
    }>;
    create(dto: CreateTransferDto, req: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            qty: number;
            batchId: string | null;
            transferId: string;
        })[];
        fromWarehouse: {
            code: string;
            name: string;
        };
        toWarehouse: {
            code: string;
            name: string;
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
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
        transferNumber: string;
    }>;
    confirm(id: string, req: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            qty: number;
            batchId: string | null;
            transferId: string;
        })[];
        fromWarehouse: {
            code: string;
            name: string;
        };
        toWarehouse: {
            code: string;
            name: string;
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
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
        transferNumber: string;
    }>;
    cancel(id: string, req: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            qty: number;
            batchId: string | null;
            transferId: string;
        })[];
        fromWarehouse: {
            code: string;
            name: string;
        };
        toWarehouse: {
            code: string;
            name: string;
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
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
        transferNumber: string;
    }>;
}
