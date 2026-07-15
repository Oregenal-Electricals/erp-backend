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
    findOne(id: string, req: any): Promise<{
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
    create(dto: CreateAdjustmentDto, req: any): Promise<{
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
    approve(id: string, req: any): Promise<{
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
    cancel(id: string, req: any): Promise<{
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
}
