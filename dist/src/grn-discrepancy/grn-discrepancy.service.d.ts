import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { RaiseDiscrepancyDto, CorrectDiscrepancyDto, PurchaseReviewDto, QcReviewDto, RequestResolutionDto, DecideResolutionDto, DirectResolveDto, SegregateDiscrepancyDto } from './dto/grn-discrepancy.dto';
export declare class GrnDiscrepancyService {
    private prisma;
    private audit;
    private notifications;
    private workflows;
    private stockLedger;
    constructor(prisma: PrismaService, audit: AuditService, notifications: NotificationsService, workflows: WorkflowsService, stockLedger: StockLedgerService);
    private generateNumber;
    private includes;
    raise(grnItemId: string, dto: RaiseDiscrepancyDto, user: any): Promise<{
        grnItem: {
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            heldQty: number;
        };
        raisedBy: {
            firstName: string;
            lastName: string;
        };
        resolvedBy: {
            firstName: string;
            lastName: string;
        };
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
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
        reason: string | null;
        remarks: string | null;
        supplierName: string;
        poItemId: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        poId: string | null;
        damageType: string | null;
        gateInwardEntryId: string | null;
        discrepancyNumber: string;
        grnItemId: string;
        purchaseNotifiedAt: Date | null;
        raisedById: string;
        raisedAt: Date;
        resolvedById: string | null;
        resolvedAt: Date | null;
        grnId: string;
        expectedSpecification: string | null;
        expectedBatch: string | null;
        physicalItemCode: string | null;
        physicalItemName: string | null;
        physicalSpecification: string | null;
        physicalBatch: string | null;
        affectedQty: number;
        problemType: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        segregatedById: string | null;
        segregatedAt: Date | null;
        purchaseStatus: string;
        qcStatus: string;
        qcInspectionId: string | null;
        resolution: string | null;
        resolutionApprovalRequestId: string | null;
        holdBinId: string | null;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            grnItem: {
                itemCode: string;
                itemName: string;
                uom: string;
                receivedQty: number;
                heldQty: number;
            };
            raisedBy: {
                firstName: string;
                lastName: string;
            };
            resolvedBy: {
                firstName: string;
                lastName: string;
            };
            grn: {
                warehouse: {
                    name: string;
                };
                grnNumber: string;
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
            reason: string | null;
            remarks: string | null;
            supplierName: string;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            poId: string | null;
            damageType: string | null;
            gateInwardEntryId: string | null;
            discrepancyNumber: string;
            grnItemId: string;
            purchaseNotifiedAt: Date | null;
            raisedById: string;
            raisedAt: Date;
            resolvedById: string | null;
            resolvedAt: Date | null;
            grnId: string;
            expectedSpecification: string | null;
            expectedBatch: string | null;
            physicalItemCode: string | null;
            physicalItemName: string | null;
            physicalSpecification: string | null;
            physicalBatch: string | null;
            affectedQty: number;
            problemType: string;
            evidence: import("@prisma/client/runtime/library").JsonValue | null;
            segregatedById: string | null;
            segregatedAt: Date | null;
            purchaseStatus: string;
            qcStatus: string;
            qcInspectionId: string | null;
            resolution: string | null;
            resolutionApprovalRequestId: string | null;
            holdBinId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        grnItem: {
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            heldQty: number;
        };
        raisedBy: {
            firstName: string;
            lastName: string;
        };
        resolvedBy: {
            firstName: string;
            lastName: string;
        };
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
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
        reason: string | null;
        remarks: string | null;
        supplierName: string;
        poItemId: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        poId: string | null;
        damageType: string | null;
        gateInwardEntryId: string | null;
        discrepancyNumber: string;
        grnItemId: string;
        purchaseNotifiedAt: Date | null;
        raisedById: string;
        raisedAt: Date;
        resolvedById: string | null;
        resolvedAt: Date | null;
        grnId: string;
        expectedSpecification: string | null;
        expectedBatch: string | null;
        physicalItemCode: string | null;
        physicalItemName: string | null;
        physicalSpecification: string | null;
        physicalBatch: string | null;
        affectedQty: number;
        problemType: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        segregatedById: string | null;
        segregatedAt: Date | null;
        purchaseStatus: string;
        qcStatus: string;
        qcInspectionId: string | null;
        resolution: string | null;
        resolutionApprovalRequestId: string | null;
        holdBinId: string | null;
    }>;
    correct(id: string, dto: CorrectDiscrepancyDto, user: any): Promise<{
        grnItem: {
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            heldQty: number;
        };
        raisedBy: {
            firstName: string;
            lastName: string;
        };
        resolvedBy: {
            firstName: string;
            lastName: string;
        };
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
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
        reason: string | null;
        remarks: string | null;
        supplierName: string;
        poItemId: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        poId: string | null;
        damageType: string | null;
        gateInwardEntryId: string | null;
        discrepancyNumber: string;
        grnItemId: string;
        purchaseNotifiedAt: Date | null;
        raisedById: string;
        raisedAt: Date;
        resolvedById: string | null;
        resolvedAt: Date | null;
        grnId: string;
        expectedSpecification: string | null;
        expectedBatch: string | null;
        physicalItemCode: string | null;
        physicalItemName: string | null;
        physicalSpecification: string | null;
        physicalBatch: string | null;
        affectedQty: number;
        problemType: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        segregatedById: string | null;
        segregatedAt: Date | null;
        purchaseStatus: string;
        qcStatus: string;
        qcInspectionId: string | null;
        resolution: string | null;
        resolutionApprovalRequestId: string | null;
        holdBinId: string | null;
    }>;
    purchaseReview(id: string, dto: PurchaseReviewDto, user: any): Promise<{
        grnItem: {
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            heldQty: number;
        };
        raisedBy: {
            firstName: string;
            lastName: string;
        };
        resolvedBy: {
            firstName: string;
            lastName: string;
        };
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
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
        reason: string | null;
        remarks: string | null;
        supplierName: string;
        poItemId: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        poId: string | null;
        damageType: string | null;
        gateInwardEntryId: string | null;
        discrepancyNumber: string;
        grnItemId: string;
        purchaseNotifiedAt: Date | null;
        raisedById: string;
        raisedAt: Date;
        resolvedById: string | null;
        resolvedAt: Date | null;
        grnId: string;
        expectedSpecification: string | null;
        expectedBatch: string | null;
        physicalItemCode: string | null;
        physicalItemName: string | null;
        physicalSpecification: string | null;
        physicalBatch: string | null;
        affectedQty: number;
        problemType: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        segregatedById: string | null;
        segregatedAt: Date | null;
        purchaseStatus: string;
        qcStatus: string;
        qcInspectionId: string | null;
        resolution: string | null;
        resolutionApprovalRequestId: string | null;
        holdBinId: string | null;
    }>;
    qcReview(id: string, dto: QcReviewDto, user: any): Promise<{
        grnItem: {
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            heldQty: number;
        };
        raisedBy: {
            firstName: string;
            lastName: string;
        };
        resolvedBy: {
            firstName: string;
            lastName: string;
        };
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
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
        reason: string | null;
        remarks: string | null;
        supplierName: string;
        poItemId: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        poId: string | null;
        damageType: string | null;
        gateInwardEntryId: string | null;
        discrepancyNumber: string;
        grnItemId: string;
        purchaseNotifiedAt: Date | null;
        raisedById: string;
        raisedAt: Date;
        resolvedById: string | null;
        resolvedAt: Date | null;
        grnId: string;
        expectedSpecification: string | null;
        expectedBatch: string | null;
        physicalItemCode: string | null;
        physicalItemName: string | null;
        physicalSpecification: string | null;
        physicalBatch: string | null;
        affectedQty: number;
        problemType: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        segregatedById: string | null;
        segregatedAt: Date | null;
        purchaseStatus: string;
        qcStatus: string;
        qcInspectionId: string | null;
        resolution: string | null;
        resolutionApprovalRequestId: string | null;
        holdBinId: string | null;
    }>;
    requestResolution(id: string, dto: RequestResolutionDto, user: any): Promise<{
        grnItem: {
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            heldQty: number;
        };
        raisedBy: {
            firstName: string;
            lastName: string;
        };
        resolvedBy: {
            firstName: string;
            lastName: string;
        };
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
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
        reason: string | null;
        remarks: string | null;
        supplierName: string;
        poItemId: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        poId: string | null;
        damageType: string | null;
        gateInwardEntryId: string | null;
        discrepancyNumber: string;
        grnItemId: string;
        purchaseNotifiedAt: Date | null;
        raisedById: string;
        raisedAt: Date;
        resolvedById: string | null;
        resolvedAt: Date | null;
        grnId: string;
        expectedSpecification: string | null;
        expectedBatch: string | null;
        physicalItemCode: string | null;
        physicalItemName: string | null;
        physicalSpecification: string | null;
        physicalBatch: string | null;
        affectedQty: number;
        problemType: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        segregatedById: string | null;
        segregatedAt: Date | null;
        purchaseStatus: string;
        qcStatus: string;
        qcInspectionId: string | null;
        resolution: string | null;
        resolutionApprovalRequestId: string | null;
        holdBinId: string | null;
    }>;
    decideResolution(id: string, dto: DecideResolutionDto, user: any): Promise<{
        grnItem: {
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            heldQty: number;
        };
        raisedBy: {
            firstName: string;
            lastName: string;
        };
        resolvedBy: {
            firstName: string;
            lastName: string;
        };
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
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
        reason: string | null;
        remarks: string | null;
        supplierName: string;
        poItemId: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        poId: string | null;
        damageType: string | null;
        gateInwardEntryId: string | null;
        discrepancyNumber: string;
        grnItemId: string;
        purchaseNotifiedAt: Date | null;
        raisedById: string;
        raisedAt: Date;
        resolvedById: string | null;
        resolvedAt: Date | null;
        grnId: string;
        expectedSpecification: string | null;
        expectedBatch: string | null;
        physicalItemCode: string | null;
        physicalItemName: string | null;
        physicalSpecification: string | null;
        physicalBatch: string | null;
        affectedQty: number;
        problemType: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        segregatedById: string | null;
        segregatedAt: Date | null;
        purchaseStatus: string;
        qcStatus: string;
        qcInspectionId: string | null;
        resolution: string | null;
        resolutionApprovalRequestId: string | null;
        holdBinId: string | null;
    }>;
    segregate(id: string, dto: SegregateDiscrepancyDto, user: any): Promise<{
        grnItem: {
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            heldQty: number;
        };
        raisedBy: {
            firstName: string;
            lastName: string;
        };
        resolvedBy: {
            firstName: string;
            lastName: string;
        };
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
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
        reason: string | null;
        remarks: string | null;
        supplierName: string;
        poItemId: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        poId: string | null;
        damageType: string | null;
        gateInwardEntryId: string | null;
        discrepancyNumber: string;
        grnItemId: string;
        purchaseNotifiedAt: Date | null;
        raisedById: string;
        raisedAt: Date;
        resolvedById: string | null;
        resolvedAt: Date | null;
        grnId: string;
        expectedSpecification: string | null;
        expectedBatch: string | null;
        physicalItemCode: string | null;
        physicalItemName: string | null;
        physicalSpecification: string | null;
        physicalBatch: string | null;
        affectedQty: number;
        problemType: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        segregatedById: string | null;
        segregatedAt: Date | null;
        purchaseStatus: string;
        qcStatus: string;
        qcInspectionId: string | null;
        resolution: string | null;
        resolutionApprovalRequestId: string | null;
        holdBinId: string | null;
    }>;
    resolveDirect(id: string, dto: DirectResolveDto, user: any): Promise<{
        grnItem: {
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            heldQty: number;
        };
        raisedBy: {
            firstName: string;
            lastName: string;
        };
        resolvedBy: {
            firstName: string;
            lastName: string;
        };
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
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
        reason: string | null;
        remarks: string | null;
        supplierName: string;
        poItemId: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        poId: string | null;
        damageType: string | null;
        gateInwardEntryId: string | null;
        discrepancyNumber: string;
        grnItemId: string;
        purchaseNotifiedAt: Date | null;
        raisedById: string;
        raisedAt: Date;
        resolvedById: string | null;
        resolvedAt: Date | null;
        grnId: string;
        expectedSpecification: string | null;
        expectedBatch: string | null;
        physicalItemCode: string | null;
        physicalItemName: string | null;
        physicalSpecification: string | null;
        physicalBatch: string | null;
        affectedQty: number;
        problemType: string;
        evidence: import("@prisma/client/runtime/library").JsonValue | null;
        segregatedById: string | null;
        segregatedAt: Date | null;
        purchaseStatus: string;
        qcStatus: string;
        qcInspectionId: string | null;
        resolution: string | null;
        resolutionApprovalRequestId: string | null;
        holdBinId: string | null;
    }>;
}
