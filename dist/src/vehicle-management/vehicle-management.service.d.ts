import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import { CreateVehicleDto, UpdateVehicleDto, LogVehicleEntryDto, LogVehicleExitDto } from './dto/vehicle.dto';
import { VehicleLogStatus } from '@prisma/client';
export declare class VehicleManagementService {
    private prisma;
    private audit;
    private settings;
    constructor(prisma: PrismaService, audit: AuditService, settings: SettingsService);
    createVehicle(dto: CreateVehicleDto, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        vehicleNumber: string;
        remarks: string | null;
        vehicleType: import("@prisma/client").$Enums.VehicleType;
        ownerName: string | null;
        ownerMobile: string | null;
        isCompanyVehicle: boolean;
    }>;
    findAllVehicles(user: any, search?: string): Promise<({
        _count: {
            logs: number;
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
        vehicleNumber: string;
        remarks: string | null;
        vehicleType: import("@prisma/client").$Enums.VehicleType;
        ownerName: string | null;
        ownerMobile: string | null;
        isCompanyVehicle: boolean;
    })[]>;
    findOneVehicle(id: string): Promise<{
        logs: ({
            plant: {
                id: string;
                name: string;
                code: string;
            };
            entryBy: {
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
            status: import("@prisma/client").$Enums.VehicleLogStatus;
            purpose: import("@prisma/client").$Enums.VehiclePurpose;
            remarks: string | null;
            logNumber: string;
            vehicleId: string;
            driverName: string;
            driverMobile: string | null;
            driverLicense: string | null;
            inWeight: number | null;
            materialDescription: string | null;
            supplierName: string | null;
            customerName: string | null;
            poNumber: string | null;
            expectedExitTime: Date | null;
            outWeight: number | null;
            entryTime: Date;
            netWeight: number | null;
            exitTime: Date | null;
            entryById: string;
            exitById: string | null;
        })[];
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        vehicleNumber: string;
        remarks: string | null;
        vehicleType: import("@prisma/client").$Enums.VehicleType;
        ownerName: string | null;
        ownerMobile: string | null;
        isCompanyVehicle: boolean;
    }>;
    updateVehicle(id: string, dto: UpdateVehicleDto, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        vehicleNumber: string;
        remarks: string | null;
        vehicleType: import("@prisma/client").$Enums.VehicleType;
        ownerName: string | null;
        ownerMobile: string | null;
        isCompanyVehicle: boolean;
    }>;
    logEntry(dto: LogVehicleEntryDto, user: any): Promise<{
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            ownerName: string;
        };
        entryBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        exitBy: {
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
        status: import("@prisma/client").$Enums.VehicleLogStatus;
        purpose: import("@prisma/client").$Enums.VehiclePurpose;
        remarks: string | null;
        logNumber: string;
        vehicleId: string;
        driverName: string;
        driverMobile: string | null;
        driverLicense: string | null;
        inWeight: number | null;
        materialDescription: string | null;
        supplierName: string | null;
        customerName: string | null;
        poNumber: string | null;
        expectedExitTime: Date | null;
        outWeight: number | null;
        entryTime: Date;
        netWeight: number | null;
        exitTime: Date | null;
        entryById: string;
        exitById: string | null;
    }>;
    logExit(id: string, dto: LogVehicleExitDto, user: any): Promise<{
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            ownerName: string;
        };
        entryBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        exitBy: {
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
        status: import("@prisma/client").$Enums.VehicleLogStatus;
        purpose: import("@prisma/client").$Enums.VehiclePurpose;
        remarks: string | null;
        logNumber: string;
        vehicleId: string;
        driverName: string;
        driverMobile: string | null;
        driverLicense: string | null;
        inWeight: number | null;
        materialDescription: string | null;
        supplierName: string | null;
        customerName: string | null;
        poNumber: string | null;
        expectedExitTime: Date | null;
        outWeight: number | null;
        entryTime: Date;
        netWeight: number | null;
        exitTime: Date | null;
        entryById: string;
        exitById: string | null;
    }>;
    findAllLogs(user: any, filters: {
        plantId?: string;
        status?: VehicleLogStatus;
        date?: string;
        purpose?: string;
    }): Promise<({
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            ownerName: string;
        };
        entryBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        exitBy: {
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
        status: import("@prisma/client").$Enums.VehicleLogStatus;
        purpose: import("@prisma/client").$Enums.VehiclePurpose;
        remarks: string | null;
        logNumber: string;
        vehicleId: string;
        driverName: string;
        driverMobile: string | null;
        driverLicense: string | null;
        inWeight: number | null;
        materialDescription: string | null;
        supplierName: string | null;
        customerName: string | null;
        poNumber: string | null;
        expectedExitTime: Date | null;
        outWeight: number | null;
        entryTime: Date;
        netWeight: number | null;
        exitTime: Date | null;
        entryById: string;
        exitById: string | null;
    })[]>;
    getActiveVehicles(user: any): Promise<({
        plant: {
            id: string;
            name: string;
            code: string;
        };
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            ownerName: string;
        };
        entryBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        exitBy: {
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
        status: import("@prisma/client").$Enums.VehicleLogStatus;
        purpose: import("@prisma/client").$Enums.VehiclePurpose;
        remarks: string | null;
        logNumber: string;
        vehicleId: string;
        driverName: string;
        driverMobile: string | null;
        driverLicense: string | null;
        inWeight: number | null;
        materialDescription: string | null;
        supplierName: string | null;
        customerName: string | null;
        poNumber: string | null;
        expectedExitTime: Date | null;
        outWeight: number | null;
        entryTime: Date;
        netWeight: number | null;
        exitTime: Date | null;
        entryById: string;
        exitById: string | null;
    })[]>;
    getStats(user: any): Promise<{
        totalVehicles: number;
        insideNow: number;
        todayIn: number;
        todayOut: number;
        totalLogs: number;
    }>;
    private logIncludes;
}
