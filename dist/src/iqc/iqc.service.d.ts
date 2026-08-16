import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateIqcDto, UpdateIqcItemsDto } from './dto/iqc.dto';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
export declare class IqcService {
    private prisma;
    private audit;
    private stockLedger;
    constructor(prisma: PrismaService, audit: AuditService, stockLedger: StockLedgerService);
    private generateIqcNumber;
    private includes;
    create(dto: CreateIqcDto, user: any): Promise<{
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
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        inspectionDate: Date;
        iqcNumber: string;
        inspectedBy: string | null;
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
                grnNumber: string;
                grnType: string;
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
            grnId: string;
            inspectionDate: Date;
            iqcNumber: string;
            inspectedBy: string | null;
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
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        inspectionDate: Date;
        iqcNumber: string;
        inspectedBy: string | null;
    }>;
    findByGrn(grnId: string, user: any): Promise<({
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
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        inspectionDate: Date;
        iqcNumber: string;
        inspectedBy: string | null;
    })[]>;
    updateItems(id: string, dto: UpdateIqcItemsDto, user: any): Promise<{
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
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        inspectionDate: Date;
        iqcNumber: string;
        inspectedBy: string | null;
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
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        inspectionDate: Date;
        iqcNumber: string;
        inspectedBy: string | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        approved: number;
    }>;
}
