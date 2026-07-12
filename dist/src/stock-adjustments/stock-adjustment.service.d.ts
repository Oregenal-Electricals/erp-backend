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
            systemQty: number;
            physicalQty: number;
            adjustmentQty: number;
            adjustmentId: string;
        }[];
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
        status: string;
        reason: string;
        remarks: string | null;
        warehouseId: string;
        adjustmentType: string;
        adjustmentNumber: string;
    }>;
    approve(id: string, user: any): Promise<{
        items: {
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
            systemQty: number;
            physicalQty: number;
            adjustmentQty: number;
            adjustmentId: string;
        }[];
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
        status: string;
        reason: string;
        remarks: string | null;
        warehouseId: string;
        adjustmentType: string;
        adjustmentNumber: string;
    }>;
    cancel(id: string, user: any): Promise<{
        items: {
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
            systemQty: number;
            physicalQty: number;
            adjustmentQty: number;
            adjustmentId: string;
        }[];
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
        status: string;
        reason: string;
        remarks: string | null;
        warehouseId: string;
        adjustmentType: string;
        adjustmentNumber: string;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            warehouse: {
                name: string;
            };
            _count: {
                items: number;
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
            reason: string;
            remarks: string | null;
            warehouseId: string;
            adjustmentType: string;
            adjustmentNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        items: {
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
            systemQty: number;
            physicalQty: number;
            adjustmentQty: number;
            adjustmentId: string;
        }[];
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
        status: string;
        reason: string;
        remarks: string | null;
        warehouseId: string;
        adjustmentType: string;
        adjustmentNumber: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        approved: number;
        cancelled: number;
        byType: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.StockAdjustmentGroupByOutputType, "adjustmentType"[]> & {
            _count: number;
        })[];
        byReason: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.StockAdjustmentGroupByOutputType, "reason"[]> & {
            _count: number;
        })[];
    }>;
}
