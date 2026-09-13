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
    private getSystemQty;
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
            status: string;
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            batchId: string | null;
            binId: string | null;
            physicalQty: number;
            systemQty: number;
            adjustmentQty: number;
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
        adjustmentType: string;
        adjustmentNumber: string;
        reversedAdjustmentId: string | null;
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
            status: string;
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            batchId: string | null;
            binId: string | null;
            physicalQty: number;
            systemQty: number;
            adjustmentQty: number;
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
        adjustmentType: string;
        adjustmentNumber: string;
        reversedAdjustmentId: string | null;
    }>;
    reverse(id: string, user: any, reason: string): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            batchId: string | null;
            binId: string | null;
            physicalQty: number;
            systemQty: number;
            adjustmentQty: number;
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
        adjustmentType: string;
        adjustmentNumber: string;
        reversedAdjustmentId: string | null;
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
            status: string;
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            batchId: string | null;
            binId: string | null;
            physicalQty: number;
            systemQty: number;
            adjustmentQty: number;
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
        adjustmentType: string;
        adjustmentNumber: string;
        reversedAdjustmentId: string | null;
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
            adjustmentType: string;
            adjustmentNumber: string;
            reversedAdjustmentId: string | null;
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
            status: string;
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            batchId: string | null;
            binId: string | null;
            physicalQty: number;
            systemQty: number;
            adjustmentQty: number;
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
        adjustmentType: string;
        adjustmentNumber: string;
        reversedAdjustmentId: string | null;
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
