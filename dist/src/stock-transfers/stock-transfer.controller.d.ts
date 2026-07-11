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
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.StockTransferGroupByOutputType, "transferType"[]> & {
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
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            transferNumber: string;
            transferType: string;
            fromWarehouseId: string;
            toWarehouseId: string;
            fromBinId: string | null;
            toBinId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        items: ({
            batch: {
                batchNumber: string;
                lotNumber: string;
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
            itemCode: string;
            itemName: string;
            unitCost: number;
            uom: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        transferNumber: string;
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
    }>;
    create(dto: CreateTransferDto, req: any): Promise<{
        items: ({
            batch: {
                batchNumber: string;
                lotNumber: string;
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
            itemCode: string;
            itemName: string;
            unitCost: number;
            uom: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        transferNumber: string;
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
    }>;
    confirm(id: string, req: any): Promise<{
        items: ({
            batch: {
                batchNumber: string;
                lotNumber: string;
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
            itemCode: string;
            itemName: string;
            unitCost: number;
            uom: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        transferNumber: string;
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
    }>;
    cancel(id: string, req: any): Promise<{
        items: ({
            batch: {
                batchNumber: string;
                lotNumber: string;
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
            itemCode: string;
            itemName: string;
            unitCost: number;
            uom: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        transferNumber: string;
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
    }>;
}
