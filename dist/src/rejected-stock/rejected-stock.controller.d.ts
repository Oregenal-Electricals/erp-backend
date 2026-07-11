import { RejectedStockService } from './rejected-stock.service';
import { DisposeItemDto } from './dto/rejected-stock.dto';
export declare class RejectedStockController {
    private readonly rsService;
    constructor(rsService: RejectedStockService);
    getStats(req: any): Promise<{
        total: number;
        quarantined: number;
        closed: number;
        totalRejectedQty: number;
        byDisposition: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.RejectedStockItemGroupByOutputType, "disposition"[]> & {
            _sum: {
                rejectedQty: number;
            };
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
            grnId: string;
            totalRejectedQty: number;
            iqcId: string;
            rejectionNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
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
            rejectedQty: number;
            rejectionReason: string | null;
            disposition: string;
            rejectedStockId: string;
            iqcItemId: string | null;
            dispositionDate: Date | null;
            dispositionBy: string | null;
            dispositionNotes: string | null;
        }[];
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
        grnId: string;
        totalRejectedQty: number;
        iqcId: string;
        rejectionNumber: string;
    }>;
    createFromIqc(iqcId: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
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
            rejectedQty: number;
            rejectionReason: string | null;
            disposition: string;
            rejectedStockId: string;
            iqcItemId: string | null;
            dispositionDate: Date | null;
            dispositionBy: string | null;
            dispositionNotes: string | null;
        }[];
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
        grnId: string;
        totalRejectedQty: number;
        iqcId: string;
        rejectionNumber: string;
    }>;
    disposeItem(id: string, itemId: string, dto: DisposeItemDto, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
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
            rejectedQty: number;
            rejectionReason: string | null;
            disposition: string;
            rejectedStockId: string;
            iqcItemId: string | null;
            dispositionDate: Date | null;
            dispositionBy: string | null;
            dispositionNotes: string | null;
        }[];
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
        grnId: string;
        totalRejectedQty: number;
        iqcId: string;
        rejectionNumber: string;
    }>;
    close(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
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
            rejectedQty: number;
            rejectionReason: string | null;
            disposition: string;
            rejectedStockId: string;
            iqcItemId: string | null;
            dispositionDate: Date | null;
            dispositionBy: string | null;
            dispositionNotes: string | null;
        }[];
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
        grnId: string;
        totalRejectedQty: number;
        iqcId: string;
        rejectionNumber: string;
    }>;
}
