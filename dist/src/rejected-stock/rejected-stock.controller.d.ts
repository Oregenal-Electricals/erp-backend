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
            _count: number;
            _sum: {
                rejectedQty: number;
            };
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
            grn: {
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
            iqcId: string;
            rejectionNumber: string;
            totalRejectedQty: number;
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
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            disposition: string;
            dispositionNotes: string | null;
            dispositionBy: string | null;
            iqcItemId: string | null;
            dispositionDate: Date | null;
            rejectedStockId: string;
        }[];
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
        iqcId: string;
        rejectionNumber: string;
        totalRejectedQty: number;
    }>;
    createFromIqc(iqcId: string, req: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            disposition: string;
            dispositionNotes: string | null;
            dispositionBy: string | null;
            iqcItemId: string | null;
            dispositionDate: Date | null;
            rejectedStockId: string;
        }[];
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
        iqcId: string;
        rejectionNumber: string;
        totalRejectedQty: number;
    }>;
    disposeItem(id: string, itemId: string, dto: DisposeItemDto, req: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            disposition: string;
            dispositionNotes: string | null;
            dispositionBy: string | null;
            iqcItemId: string | null;
            dispositionDate: Date | null;
            rejectedStockId: string;
        }[];
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
        iqcId: string;
        rejectionNumber: string;
        totalRejectedQty: number;
    }>;
    close(id: string, req: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            disposition: string;
            dispositionNotes: string | null;
            dispositionBy: string | null;
            iqcItemId: string | null;
            dispositionDate: Date | null;
            rejectedStockId: string;
        }[];
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
        iqcId: string;
        rejectionNumber: string;
        totalRejectedQty: number;
    }>;
}
