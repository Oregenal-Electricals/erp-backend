import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import { CreateGateInwardDto, UpdateGateInwardDto, VerifyGateInwardDto, RejectGateInwardDto } from './dto/gate-inward.dto';
import { GateInwardStatus } from '@prisma/client';
export declare class GateInwardService {
    private prisma;
    private audit;
    private settings;
    constructor(prisma: PrismaService, audit: AuditService, settings: SettingsService);
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
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        unit: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        remarks: string | null;
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
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
    }>;
    findAll(user: any, filters: {
        status?: GateInwardStatus;
        plantId?: string;
        date?: string;
        search?: string;
    }): Promise<({
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
        unit: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        remarks: string | null;
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
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
    })[]>;
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
        unit: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        remarks: string | null;
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
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
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
        unit: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        remarks: string | null;
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
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
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
        unit: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        remarks: string | null;
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
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
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
        unit: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        remarks: string | null;
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
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
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
        unit: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        remarks: string | null;
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
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
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
        unit: string;
        status: import(".prisma/client").$Enums.GateInwardStatus;
        remarks: string | null;
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
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        pending: number;
        verified: number;
        sentToStores: number;
        completed: number;
        rejected: number;
        todayIn: number;
    }>;
    private includes;
}
