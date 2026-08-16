import { GateInwardStatus } from '@prisma/client';
import { GateInwardService } from './gate-inward.service';
import { CreateGateInwardDto, UpdateGateInwardDto, VerifyGateInwardDto, RejectGateInwardDto } from './dto/gate-inward.dto';
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
            quantity: number;
            packageCount: number | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
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
        remarks: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        ginNumber: string;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number | null;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        completedAt: Date | null;
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
            quantity: number;
            packageCount: number | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
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
        remarks: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        ginNumber: string;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number | null;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        completedAt: Date | null;
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
            quantity: number;
            packageCount: number | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
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
        remarks: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        ginNumber: string;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number | null;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        completedAt: Date | null;
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
            quantity: number;
            packageCount: number | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
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
        remarks: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        ginNumber: string;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number | null;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        completedAt: Date | null;
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
            quantity: number;
            packageCount: number | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
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
        remarks: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        ginNumber: string;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number | null;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        completedAt: Date | null;
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
            quantity: number;
            packageCount: number | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
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
        remarks: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        ginNumber: string;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number | null;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        completedAt: Date | null;
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
            quantity: number;
            packageCount: number | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
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
        remarks: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        ginNumber: string;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number | null;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        completedAt: Date | null;
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
            quantity: number;
            packageCount: number | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
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
        remarks: string | null;
        materialDescription: string | null;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        ginNumber: string;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number | null;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        receivedById: string;
        verifiedById: string | null;
        verifiedAt: Date | null;
        completedAt: Date | null;
    }>;
}
