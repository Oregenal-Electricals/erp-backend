import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateIqcDto, UpdateIqcItemsDto } from './dto/iqc.dto';
export declare class IqcService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateIqcNumber;
    private includes;
    create(dto: CreateIqcDto, user: any): Promise<{
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
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
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
        grnId: string;
        inspectedBy: string | null;
        iqcNumber: string;
        inspectionDate: Date;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
            grn: {
                warehouse: {
                    name: string;
                };
                grnType: string;
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
            grnId: string;
            inspectedBy: string | null;
            iqcNumber: string;
            inspectionDate: Date;
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
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
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
        grnId: string;
        inspectedBy: string | null;
        iqcNumber: string;
        inspectionDate: Date;
    }>;
    findByGrn(grnId: string, user: any): Promise<({
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
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
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
        grnId: string;
        inspectedBy: string | null;
        iqcNumber: string;
        inspectionDate: Date;
    })[]>;
    updateItems(id: string, dto: UpdateIqcItemsDto, user: any): Promise<{
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
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
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
        grnId: string;
        inspectedBy: string | null;
        iqcNumber: string;
        inspectionDate: Date;
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
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
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
        grnId: string;
        inspectedBy: string | null;
        iqcNumber: string;
        inspectionDate: Date;
    }>;
    getStats(user: any): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        approved: number;
    }>;
}
