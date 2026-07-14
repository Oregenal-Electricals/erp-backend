import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import { CreateGateOutwardDto, UpdateGateOutwardDto, ApproveGateOutwardDto, CancelGateOutwardDto } from './dto/gate-outward.dto';
import { GateOutwardStatus } from '@prisma/client';
export declare class GateOutwardService {
    private prisma;
    private audit;
    private settings;
    constructor(prisma: PrismaService, audit: AuditService, settings: SettingsService);
    create(dto: CreateGateOutwardDto, user: any): Promise<{
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
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        dispatchedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        createdByUser: {
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
        status: import("@prisma/client").$Enums.GateOutwardStatus;
        remarks: string | null;
        materialDescription: string;
        customerName: string;
        netWeight: number | null;
        vehicleLogId: string | null;
        invoiceNumber: string | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        customerMobile: string | null;
        customerAddress: string | null;
        customerGstin: string | null;
        salesOrderNumber: string | null;
        deliveryChallanNumber: string | null;
        cancelReason: string | null;
        goeNumber: string;
        authorizedAt: Date | null;
        dispatchedAt: Date | null;
        authorizedById: string | null;
        dispatchedById: string | null;
        createdById: string;
    }>;
    findAll(user: any, filters: {
        status?: GateOutwardStatus;
        plantId?: string;
        date?: string;
        search?: string;
    }): Promise<({
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
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        dispatchedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        createdByUser: {
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
        status: import("@prisma/client").$Enums.GateOutwardStatus;
        remarks: string | null;
        materialDescription: string;
        customerName: string;
        netWeight: number | null;
        vehicleLogId: string | null;
        invoiceNumber: string | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        customerMobile: string | null;
        customerAddress: string | null;
        customerGstin: string | null;
        salesOrderNumber: string | null;
        deliveryChallanNumber: string | null;
        cancelReason: string | null;
        goeNumber: string;
        authorizedAt: Date | null;
        dispatchedAt: Date | null;
        authorizedById: string | null;
        dispatchedById: string | null;
        createdById: string;
    })[]>;
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
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        dispatchedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        createdByUser: {
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
        status: import("@prisma/client").$Enums.GateOutwardStatus;
        remarks: string | null;
        materialDescription: string;
        customerName: string;
        netWeight: number | null;
        vehicleLogId: string | null;
        invoiceNumber: string | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        customerMobile: string | null;
        customerAddress: string | null;
        customerGstin: string | null;
        salesOrderNumber: string | null;
        deliveryChallanNumber: string | null;
        cancelReason: string | null;
        goeNumber: string;
        authorizedAt: Date | null;
        dispatchedAt: Date | null;
        authorizedById: string | null;
        dispatchedById: string | null;
        createdById: string;
    }>;
    update(id: string, dto: UpdateGateOutwardDto, user: any): Promise<{
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
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        dispatchedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        createdByUser: {
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
        status: import("@prisma/client").$Enums.GateOutwardStatus;
        remarks: string | null;
        materialDescription: string;
        customerName: string;
        netWeight: number | null;
        vehicleLogId: string | null;
        invoiceNumber: string | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        customerMobile: string | null;
        customerAddress: string | null;
        customerGstin: string | null;
        salesOrderNumber: string | null;
        deliveryChallanNumber: string | null;
        cancelReason: string | null;
        goeNumber: string;
        authorizedAt: Date | null;
        dispatchedAt: Date | null;
        authorizedById: string | null;
        dispatchedById: string | null;
        createdById: string;
    }>;
    approve(id: string, dto: ApproveGateOutwardDto, user: any): Promise<{
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
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        dispatchedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        createdByUser: {
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
        status: import("@prisma/client").$Enums.GateOutwardStatus;
        remarks: string | null;
        materialDescription: string;
        customerName: string;
        netWeight: number | null;
        vehicleLogId: string | null;
        invoiceNumber: string | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        customerMobile: string | null;
        customerAddress: string | null;
        customerGstin: string | null;
        salesOrderNumber: string | null;
        deliveryChallanNumber: string | null;
        cancelReason: string | null;
        goeNumber: string;
        authorizedAt: Date | null;
        dispatchedAt: Date | null;
        authorizedById: string | null;
        dispatchedById: string | null;
        createdById: string;
    }>;
    dispatch(id: string, user: any): Promise<{
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
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        dispatchedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        createdByUser: {
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
        status: import("@prisma/client").$Enums.GateOutwardStatus;
        remarks: string | null;
        materialDescription: string;
        customerName: string;
        netWeight: number | null;
        vehicleLogId: string | null;
        invoiceNumber: string | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        customerMobile: string | null;
        customerAddress: string | null;
        customerGstin: string | null;
        salesOrderNumber: string | null;
        deliveryChallanNumber: string | null;
        cancelReason: string | null;
        goeNumber: string;
        authorizedAt: Date | null;
        dispatchedAt: Date | null;
        authorizedById: string | null;
        dispatchedById: string | null;
        createdById: string;
    }>;
    markDelivered(id: string, user: any): Promise<{
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
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        dispatchedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        createdByUser: {
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
        status: import("@prisma/client").$Enums.GateOutwardStatus;
        remarks: string | null;
        materialDescription: string;
        customerName: string;
        netWeight: number | null;
        vehicleLogId: string | null;
        invoiceNumber: string | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        customerMobile: string | null;
        customerAddress: string | null;
        customerGstin: string | null;
        salesOrderNumber: string | null;
        deliveryChallanNumber: string | null;
        cancelReason: string | null;
        goeNumber: string;
        authorizedAt: Date | null;
        dispatchedAt: Date | null;
        authorizedById: string | null;
        dispatchedById: string | null;
        createdById: string;
    }>;
    cancel(id: string, dto: CancelGateOutwardDto, user: any): Promise<{
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
        authorizedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        dispatchedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        createdByUser: {
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
        status: import("@prisma/client").$Enums.GateOutwardStatus;
        remarks: string | null;
        materialDescription: string;
        customerName: string;
        netWeight: number | null;
        vehicleLogId: string | null;
        invoiceNumber: string | null;
        invoiceAmount: number | null;
        quantity: number;
        grossWeight: number | null;
        packageCount: number | null;
        customerMobile: string | null;
        customerAddress: string | null;
        customerGstin: string | null;
        salesOrderNumber: string | null;
        deliveryChallanNumber: string | null;
        cancelReason: string | null;
        goeNumber: string;
        authorizedAt: Date | null;
        dispatchedAt: Date | null;
        authorizedById: string | null;
        dispatchedById: string | null;
        createdById: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        pending: number;
        approved: number;
        dispatched: number;
        delivered: number;
        cancelled: number;
        todayOut: number;
    }>;
    private includes;
}
