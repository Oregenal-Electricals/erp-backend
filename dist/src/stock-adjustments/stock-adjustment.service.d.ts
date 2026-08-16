import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateAdjustmentDto } from './dto/stock-adjustment.dto';
export declare class StockAdjustmentService {
    private prisma;
    private audit;
    private stockLedger;
    constructor(prisma: PrismaService, audit: AuditService, stockLedger: StockLedgerService);
    private generateNumber;
    private includes;
    create(dto: CreateAdjustmentDto, user: any): Promise<{
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
            unitCost: number;
            adjustmentQty: number;
            systemQty: number;
            physicalQty: number;
            adjustmentId: string;
        }[];
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
        status: string;
        reason: string;
        remarks: string | null;
        warehouseId: string;
        adjustmentNumber: string;
        adjustmentType: string;
    }>;
    approve(id: string, user: any): Promise<{
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
            unitCost: number;
            adjustmentQty: number;
            systemQty: number;
            physicalQty: number;
            adjustmentId: string;
        }[];
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
        status: string;
        reason: string;
        remarks: string | null;
        warehouseId: string;
        adjustmentNumber: string;
        adjustmentType: string;
    }>;
    cancel(id: string, user: any): Promise<{
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
            unitCost: number;
            adjustmentQty: number;
            systemQty: number;
            physicalQty: number;
            adjustmentId: string;
        }[];
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
        status: string;
        reason: string;
        remarks: string | null;
        warehouseId: string;
        adjustmentNumber: string;
        adjustmentType: string;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
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
            status: string;
            reason: string;
            remarks: string | null;
            warehouseId: string;
            adjustmentNumber: string;
            adjustmentType: string;
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
            unitCost: number;
            adjustmentQty: number;
            systemQty: number;
            physicalQty: number;
            adjustmentId: string;
        }[];
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
        status: string;
        reason: string;
        remarks: string | null;
        warehouseId: string;
        adjustmentNumber: string;
        adjustmentType: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        approved: number;
        cancelled: number;
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.StockAdjustmentGroupByOutputType, "adjustmentType"[]> & {
            _count: number;
        })[];
        byReason: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.StockAdjustmentGroupByOutputType, "reason"[]> & {
            _count: number;
        })[];
    }>;
}
