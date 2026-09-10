import { GrnDiscrepancyService } from './grn-discrepancy.service';
import { RaiseDiscrepancyDto, CorrectDiscrepancyDto } from './dto/grn-discrepancy.dto';
export declare class GrnDiscrepancyController {
    private service;
    constructor(service: GrnDiscrepancyService);
    findAll(req: any, query: any): Promise<{
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
    findOne(id: string, req: any): Promise<{
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
    raise(grnItemId: string, dto: RaiseDiscrepancyDto, req: any): Promise<{
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
    correct(id: string, dto: CorrectDiscrepancyDto, req: any): Promise<{
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
