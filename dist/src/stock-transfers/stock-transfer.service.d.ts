import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateTransferDto } from './dto/stock-transfer.dto';
export declare class StockTransferService {
    private prisma;
    private audit;
    private stockLedger;
    constructor(prisma: PrismaService, audit: AuditService, stockLedger: StockLedgerService);
    private generateNumber;
    private includes;
    create(dto: CreateTransferDto, user: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            uom: string;
            unitCost: number;
            qty: number;
            batchId: string | null;
            transferId: string;
        })[];
        fromWarehouse: {
            name: string;
            code: string;
        };
        toWarehouse: {
            name: string;
            code: string;
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
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
        transferNumber: string;
    }>;
    confirm(id: string, user: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            uom: string;
            unitCost: number;
            qty: number;
            batchId: string | null;
            transferId: string;
        })[];
        fromWarehouse: {
            name: string;
            code: string;
        };
        toWarehouse: {
            name: string;
            code: string;
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
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
        transferNumber: string;
    }>;
    cancel(id: string, user: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            uom: string;
            unitCost: number;
            qty: number;
            batchId: string | null;
            transferId: string;
        })[];
        fromWarehouse: {
            name: string;
            code: string;
        };
        toWarehouse: {
            name: string;
            code: string;
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
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
        transferNumber: string;
    }>;
    findAll(user: any, query: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            uom: string;
            unitCost: number;
            qty: number;
            batchId: string | null;
            transferId: string;
        })[];
        fromWarehouse: {
            name: string;
            code: string;
        };
        toWarehouse: {
            name: string;
            code: string;
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
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
        transferNumber: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        confirmed: number;
        cancelled: number;
        byType: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.StockTransferGroupByOutputType, "transferType"[]> & {
            _count: number;
        })[];
    }>;
}
