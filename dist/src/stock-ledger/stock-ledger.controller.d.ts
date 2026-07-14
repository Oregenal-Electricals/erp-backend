import { StockLedgerService } from './stock-ledger.service';
import { AdjustStockDto } from './dto/stock-ledger.dto';
export declare class StockLedgerController {
    private readonly slService;
    constructor(slService: StockLedgerService);
    getStats(req: any): Promise<{
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
    findBalance(req: any, query: any): Promise<{
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
    getItemLedger(code: string, req: any): Promise<({
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
        unitCost: number;
        totalCost: number;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        transactionType: string;
        inQty: number;
        outQty: number;
        balanceQty: number;
        transactionDate: Date;
    })[]>;
    findLedger(req: any, query: any): Promise<{
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
            unitCost: number;
            totalCost: number;
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
    receiveFromIqc(iqcId: string, req: any): Promise<{
        message: string;
        entries: any[];
    }>;
    adjust(dto: AdjustStockDto, req: any): Promise<{
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
        unitCost: number;
        totalCost: number;
        referenceType: string | null;
        referenceId: string | null;
        referenceNumber: string | null;
        transactionType: string;
        inQty: number;
        outQty: number;
        balanceQty: number;
        transactionDate: Date;
    }>;
}
