import { StockAdjustmentService } from './stock-adjustment.service';
import { CreateAdjustmentDto } from './dto/stock-adjustment.dto';
export declare class StockAdjustmentController {
    private readonly saService;
    constructor(saService: StockAdjustmentService);
    getStats(req: any): Promise<{
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
    findAll(req: any, query: any): Promise<{
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
    findOne(id: string, req: any): Promise<{
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
    create(dto: CreateAdjustmentDto, req: any): Promise<{
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
    approve(id: string, req: any): Promise<{
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
    cancel(id: string, req: any): Promise<{
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
}
