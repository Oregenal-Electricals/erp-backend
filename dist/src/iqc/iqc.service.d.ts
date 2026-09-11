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
            itemCode: string;
            itemName: string;
            uom: string;
            rejectionReason: string | null;
            grnItemId: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
            warehouseId: string;
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
        iqcNumber: string;
        inspectedBy: string | null;
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
            iqcNumber: string;
            inspectedBy: string | null;
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
            rejectionReason: string | null;
            grnItemId: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
            warehouseId: string;
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
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
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
            itemCode: string;
            itemName: string;
            uom: string;
            rejectionReason: string | null;
            grnItemId: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
            warehouseId: string;
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
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
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
            itemCode: string;
            itemName: string;
            uom: string;
            rejectionReason: string | null;
            grnItemId: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
            warehouseId: string;
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
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
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
            rejectionReason: string | null;
            grnItemId: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            currentStage: string;
            finalOutcome: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
            warehouseId: string;
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
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    }>;
    getStats(user: any): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        approved: number;
    }>;
}
