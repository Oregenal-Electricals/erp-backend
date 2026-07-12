import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { AdjustStockDto } from './dto/stock-ledger.dto';
export declare class StockLedgerService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    postTransaction(data: {
        companyId: string;
        itemCode: string;
        itemName: string;
        warehouseId: string;
        transactionType: string;
        referenceType?: string;
        referenceId?: string;
        referenceNumber?: string;
        inQty?: number;
        outQty?: number;
        unitCost?: number;
        remarks?: string;
        userId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        remarks: string | null;
        itemCode: string;
        itemName: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        transactionType: string;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        inQty: number;
        outQty: number;
        balanceQty: number;
        transactionDate: Date;
    }>;
    receiveFromIqc(iqcId: string, user: any): Promise<{
        message: string;
        entries: any[];
    }>;
    findLedger(user: any, query: any): Promise<{
        data: ({
            warehouse: {
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
            remarks: string | null;
            itemCode: string;
            itemName: string;
            warehouseId: string;
            unitCost: number;
            totalCost: number;
            transactionType: string;
            referenceType: string | null;
            referenceId: string | null;
            referenceNumber: string | null;
            inQty: number;
            outQty: number;
            balanceQty: number;
            transactionDate: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findBalance(user: any, query: any): Promise<{
        data: ({
            warehouse: {
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
            itemCode: string;
            itemName: string;
            warehouseId: string;
            unitCost: number;
            totalValue: number;
            availableQty: number;
            reservedQty: number;
            inQcQty: number;
            lastUpdated: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getItemLedger(itemCode: string, user: any): Promise<({
        warehouse: {
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
        remarks: string | null;
        itemCode: string;
        itemName: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        transactionType: string;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        inQty: number;
        outQty: number;
        balanceQty: number;
        transactionDate: Date;
    })[]>;
    adjust(dto: AdjustStockDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        remarks: string | null;
        itemCode: string;
        itemName: string;
        warehouseId: string;
        unitCost: number;
        totalCost: number;
        transactionType: string;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        inQty: number;
        outQty: number;
        balanceQty: number;
        transactionDate: Date;
    }>;
    getStats(user: any): Promise<{
        totalItems: number;
        totalMovements: number;
        totalValue: number;
        byType: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.StockLedgerGroupByOutputType, "transactionType"[]> & {
            _count: number;
            _sum: {
                inQty: number;
                outQty: number;
            };
        })[];
    }>;
}
