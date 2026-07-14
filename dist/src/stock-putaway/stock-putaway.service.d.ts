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
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
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
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
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
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
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
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
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
