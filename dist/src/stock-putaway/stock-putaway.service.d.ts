import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreatePutawayDto, UpdatePutawayItemsDto } from './dto/stock-putaway.dto';
export declare class StockPutawayService {
    private prisma;
    private audit;
    private stockLedger;
    constructor(prisma: PrismaService, audit: AuditService, stockLedger: StockLedgerService);
    private generateNumber;
    private includes;
    create(dto: CreatePutawayDto, user: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
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
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        grn: {
            grnType: string;
            grnNumber: string;
        };
        iqc: {
            iqcNumber: string;
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
        warehouseId: string;
        grnId: string;
        iqcId: string | null;
        putawayNumber: string;
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
            warehouseId: string;
            grnId: string;
            iqcId: string | null;
            putawayNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
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
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        grn: {
            grnType: string;
            grnNumber: string;
        };
        iqc: {
            iqcNumber: string;
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
        warehouseId: string;
        grnId: string;
        iqcId: string | null;
        putawayNumber: string;
    }>;
    updateItems(id: string, dto: UpdatePutawayItemsDto, user: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
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
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        grn: {
            grnType: string;
            grnNumber: string;
        };
        iqc: {
            iqcNumber: string;
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
        warehouseId: string;
        grnId: string;
        iqcId: string | null;
        putawayNumber: string;
    }>;
    complete(id: string, user: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
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
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        grn: {
            grnType: string;
            grnNumber: string;
        };
        iqc: {
            iqcNumber: string;
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
        warehouseId: string;
        grnId: string;
        iqcId: string | null;
        putawayNumber: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        inProgress: number;
        completed: number;
        totalQtyPutaway: number;
    }>;
}
