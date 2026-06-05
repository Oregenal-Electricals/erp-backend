import { VehicleLogStatus } from '@prisma/client';
import { VehicleManagementService } from './vehicle-management.service';
import { LogVehicleEntryDto, LogVehicleExitDto } from './dto/vehicle.dto';
export declare class VehicleLogController {
    private readonly service;
    constructor(service: VehicleManagementService);
    logEntry(dto: LogVehicleEntryDto, user: any): Promise<{
        plant: {
            id: string;
            code: string;
            name: string;
        };
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        status: import(".prisma/client").$Enums.VehicleLogStatus;
        purpose: import(".prisma/client").$Enums.VehiclePurpose;
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
    findAllLogs(user: any, plantId?: string, status?: VehicleLogStatus, purpose?: string, date?: string): Promise<({
        plant: {
            id: string;
            code: string;
            name: string;
        };
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        status: import(".prisma/client").$Enums.VehicleLogStatus;
        purpose: import(".prisma/client").$Enums.VehiclePurpose;
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
            code: string;
            name: string;
        };
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        status: import(".prisma/client").$Enums.VehicleLogStatus;
        purpose: import(".prisma/client").$Enums.VehiclePurpose;
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
    logExit(id: string, dto: LogVehicleExitDto, user: any): Promise<{
        plant: {
            id: string;
            code: string;
            name: string;
        };
        vehicle: {
            id: string;
            vehicleNumber: string;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        status: import(".prisma/client").$Enums.VehicleLogStatus;
        purpose: import(".prisma/client").$Enums.VehiclePurpose;
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
}
