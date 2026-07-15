import { GateInwardStatus } from '@prisma/client';
import { GateInwardService } from './gate-inward.service';
import { CreateGateInwardDto, UpdateGateInwardDto, VerifyGateInwardDto, RejectGateInwardDto } from './dto/gate-inward.dto';
export declare class GateInwardController {
    private readonly service;
    constructor(service: GateInwardService);
    create(dto: CreateGateInwardDto, user: any): Promise<{
        vendorMismatchWarning: string;
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
        materialDescription: string;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
    }>;
    findAll(user: any, status?: GateInwardStatus, plantId?: string, date?: string, search?: string): Promise<({
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
        materialDescription: string;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
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
        materialDescription: string;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
    }>;
    update(id: string, dto: UpdateGateInwardDto, user: any): Promise<{
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
        materialDescription: string;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
    }>;
    verify(id: string, dto: VerifyGateInwardDto, user: any): Promise<{
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
        materialDescription: string;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
    }>;
    sendToStores(id: string, user: any): Promise<{
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
        materialDescription: string;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
    }>;
    complete(id: string, user: any): Promise<{
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
        materialDescription: string;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
    }>;
    reject(id: string, dto: RejectGateInwardDto, user: any): Promise<{
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
        materialDescription: string;
        supplierName: string;
        poNumber: string | null;
        netWeight: number | null;
        vehicleLogId: string | null;
        supplierMobile: string | null;
        supplierGstin: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        rejectionReason: string | null;
        ginNumber: string;
        verifiedAt: Date | null;
        completedAt: Date | null;
        receivedById: string;
        verifiedById: string | null;
    }>;
}
