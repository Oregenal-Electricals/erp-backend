import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { RejectedStockService } from '../rejected-stock/rejected-stock.service';
import { ReinspectDto } from './dto/hold-stock.dto';
export declare class HoldStockService {
    private prisma;
    private audit;
    private stockLedger;
    private rejectedStock;
    constructor(prisma: PrismaService, audit: AuditService, stockLedger: StockLedgerService, rejectedStock: RejectedStockService);
    private generateNumber;
    private generateIqcNumber;
    private includes;
    createFromIqc(iqcId: string, user: any): Promise<{
        items: {
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
            holdQty: number;
            holdReason: string | null;
            holdStockId: string;
            iqcItemId: string | null;
            reinspectionStatus: string;
            reinspectedPassQty: number;
            reinspectedFailQty: number;
            reinspectedAt: Date | null;
            reinspectedBy: string | null;
            reinspectionNotes: string | null;
        }[];
        warehouse: {
            name: string;
            code: string;
        };
        grn: {
            grnNumber: string;
            grnType: string;
        };
        iqc: {
            iqcNumber: string;
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
        warehouseId: string;
        grnId: string | null;
        iqcId: string | null;
        holdNumber: string;
        totalHoldQty: number;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
            warehouse: {
                name: string;
            };
            grn: {
                grnNumber: string;
            };
            iqc: {
                iqcNumber: string;
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
            warehouseId: string;
            grnId: string | null;
            iqcId: string | null;
            holdNumber: string;
            totalHoldQty: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        items: {
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
            holdQty: number;
            holdReason: string | null;
            holdStockId: string;
            iqcItemId: string | null;
            reinspectionStatus: string;
            reinspectedPassQty: number;
            reinspectedFailQty: number;
            reinspectedAt: Date | null;
            reinspectedBy: string | null;
            reinspectionNotes: string | null;
        }[];
        warehouse: {
            name: string;
            code: string;
        };
        grn: {
            grnNumber: string;
            grnType: string;
        };
        iqc: {
            iqcNumber: string;
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
        warehouseId: string;
        grnId: string | null;
        iqcId: string | null;
        holdNumber: string;
        totalHoldQty: number;
    }>;
    reinspect(id: string, itemId: string, dto: ReinspectDto, user: any): Promise<{
        items: {
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
            holdQty: number;
            holdReason: string | null;
            holdStockId: string;
            iqcItemId: string | null;
            reinspectionStatus: string;
            reinspectedPassQty: number;
            reinspectedFailQty: number;
            reinspectedAt: Date | null;
            reinspectedBy: string | null;
            reinspectionNotes: string | null;
        }[];
        warehouse: {
            name: string;
            code: string;
        };
        grn: {
            grnNumber: string;
            grnType: string;
        };
        iqc: {
            iqcNumber: string;
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
        warehouseId: string;
        grnId: string | null;
        iqcId: string | null;
        holdNumber: string;
        totalHoldQty: number;
    }>;
    getStats(user: any): Promise<{
        total: number;
        held: number;
        closed: number;
        totalHoldQty: number;
    }>;
}
