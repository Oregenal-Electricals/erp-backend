import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateIqcDto, UpdateIqcItemsDto, ConfirmReceiptDto } from './dto/iqc.dto';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { RejectedStockService } from '../rejected-stock/rejected-stock.service';
import { HoldStockService } from '../hold-stock/hold-stock.service';
export declare class IqcService {
    private prisma;
    private audit;
    private stockLedger;
    private rejectedStock;
    private holdStock;
    constructor(prisma: PrismaService, audit: AuditService, stockLedger: StockLedgerService, rejectedStock: RejectedStockService, holdStock: HoldStockService);
    private generateIqcNumber;
    private includes;
    create(dto: CreateIqcDto, user: any): Promise<({
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
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            holdQty: number;
            holdReason: string | null;
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
    }) | {
        skippedIqc: boolean;
        grn: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            vehicleNumber: string | null;
            remarks: string | null;
            poId: string | null;
            invoiceNumber: string | null;
            invoiceDate: Date | null;
            gateInwardEntryId: string | null;
            grnNumber: string;
            grnType: string;
            ipoId: string | null;
            landedCostId: string | null;
            warehouseId: string;
            receivedDate: Date;
            dcNumber: string | null;
            physicallyVerifiedAt: Date | null;
            reversedById: string | null;
            reversedAt: Date | null;
            reversalReason: string | null;
        };
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
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            holdQty: number;
            holdReason: string | null;
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
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            holdQty: number;
            holdReason: string | null;
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
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            holdQty: number;
            holdReason: string | null;
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
    confirmReceipt(id: string, dto: ConfirmReceiptDto, user: any): Promise<{
        handoverMismatches: any[];
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
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            holdQty: number;
            holdReason: string | null;
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
            confirmedQty: number | null;
            templateId: string | null;
            sampleSize: number | null;
            iqcId: string;
            holdQty: number;
            holdReason: string | null;
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
