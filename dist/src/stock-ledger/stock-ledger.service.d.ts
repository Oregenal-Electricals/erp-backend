import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { AdjustStockDto } from './dto/stock-ledger.dto';
import { CustomerPoService } from '../customer-po/customer-po.service';
export declare class StockLedgerService {
    private prisma;
    private audit;
    private customerPoService;
    constructor(prisma: PrismaService, audit: AuditService, customerPoService: CustomerPoService);
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        remarks: string | null;
        itemCode: string;
        itemName: string;
        warehouseId: string;
        totalCost: number;
        unitCost: number;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        transactionType: string;
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
            remarks: string | null;
            itemCode: string;
            itemName: string;
            warehouseId: string;
            totalCost: number;
            unitCost: number;
            referenceType: string | null;
            referenceId: string | null;
            referenceNumber: string | null;
            transactionType: string;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        remarks: string | null;
        itemCode: string;
        itemName: string;
        warehouseId: string;
        totalCost: number;
        unitCost: number;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        transactionType: string;
        inQty: number;
        outQty: number;
        balanceQty: number;
        transactionDate: Date;
    })[]>;
    adjust(dto: AdjustStockDto, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        remarks: string | null;
        itemCode: string;
        itemName: string;
        warehouseId: string;
        totalCost: number;
        unitCost: number;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        transactionType: string;
        inQty: number;
        outQty: number;
        balanceQty: number;
        transactionDate: Date;
    }>;
    getStats(user: any): Promise<{
        totalItems: number;
        totalMovements: number;
        totalValue: number;
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.StockLedgerGroupByOutputType, "transactionType"[]> & {
            _count: number;
            _sum: {
                inQty: number;
                outQty: number;
            };
        })[];
    }>;
}
