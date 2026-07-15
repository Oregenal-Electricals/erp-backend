import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { DisposeItemDto } from './dto/rejected-stock.dto';
export declare class RejectedStockService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
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
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            iqcItemId: string | null;
            disposition: string;
            dispositionDate: Date | null;
            dispositionBy: string | null;
            dispositionNotes: string | null;
            rejectedStockId: string;
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
        grnId: string;
        iqcId: string;
        rejectionNumber: string;
        totalRejectedQty: number;
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
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            iqcItemId: string | null;
            disposition: string;
            dispositionDate: Date | null;
            dispositionBy: string | null;
            dispositionNotes: string | null;
            rejectedStockId: string;
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
        grnId: string;
        iqcId: string;
        rejectionNumber: string;
        totalRejectedQty: number;
    }>;
    disposeItem(id: string, itemId: string, dto: DisposeItemDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            iqcItemId: string | null;
            disposition: string;
            dispositionDate: Date | null;
            dispositionBy: string | null;
            dispositionNotes: string | null;
            rejectedStockId: string;
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
        grnId: string;
        iqcId: string;
        rejectionNumber: string;
        totalRejectedQty: number;
    }>;
    close(id: string, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            iqcItemId: string | null;
            disposition: string;
            dispositionDate: Date | null;
            dispositionBy: string | null;
            dispositionNotes: string | null;
            rejectedStockId: string;
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
        grnId: string;
        iqcId: string;
        rejectionNumber: string;
        totalRejectedQty: number;
    }>;
    getStats(user: any): Promise<{
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
}
