import { GateInwardStatus } from '@prisma/client';
import { GateInwardService } from './gate-inward.service';
import { CreateGateInwardDto, UpdateGateInwardDto, VerifyGateInwardDto, RejectGateInwardDto, GateInDto, ResolveHoldWithPoDto, ResolveHoldAsNonPoDto, ResolveHoldAsRejectedDto, ReturnMaterialDto, ApprovedExceptionDto, CorrectPoReferenceDto } from './dto/gate-inward.dto';
export declare class GateInwardController {
    private readonly service;
    constructor(service: GateInwardService);
    create(dto: CreateGateInwardDto, user: any): Promise<{
        vendorMismatchWarning: string;
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    findAll(user: any, status?: GateInwardStatus, plantId?: string, date?: string, search?: string): Promise<({
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    })[]>;
    getStats(user: any): Promise<{
        total: number;
        pending: number;
        verified: number;
        sentToStores: number;
        completed: number;
        rejected: number;
        todayIn: number;
    }>;
    findOne(id: string): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    update(id: string, dto: UpdateGateInwardDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    verify(id: string, dto: VerifyGateInwardDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    gateIn(id: string, dto: GateInDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    sendToStores(id: string, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    complete(id: string, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    reject(id: string, dto: RejectGateInwardDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    resolveHoldWithPo(id: string, dto: ResolveHoldWithPoDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    resolveHoldAsNonPo(id: string, dto: ResolveHoldAsNonPoDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    resolveHoldAsRejected(id: string, dto: ResolveHoldAsRejectedDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    resolveReturnMaterial(id: string, dto: ReturnMaterialDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    resolveApprovedException(id: string, dto: ApprovedExceptionDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
    resolveCorrectPoReference(id: string, dto: CorrectPoReferenceDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            quantity: number;
            packageCount: number | null;
            gateInwardEntryId: string;
        }[];
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicleLog: {
            id: string;
            vehicle: {
                vehicleNumber: string;
            };
            logNumber: string;
        };
        receivedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        verifiedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        gateInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        holdResolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        unit: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        quantity: number | null;
        packageCount: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        grossWeight: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        gateInById: string | null;
        gateInAt: Date | null;
        completedAt: Date | null;
        holdResolution: string | null;
        holdResolvedById: string | null;
        holdResolvedAt: Date | null;
        holdResolutionRemarks: string | null;
    }>;
}
