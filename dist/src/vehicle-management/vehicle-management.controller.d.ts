import { VehicleManagementService } from './vehicle-management.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
export declare class VehicleManagementController {
    private readonly service;
    constructor(service: VehicleManagementService);
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
    getStats(user: any): Promise<{
        totalVehicles: number;
        insideNow: number;
        todayIn: number;
        todayOut: number;
        totalLogs: number;
    }>;
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
}
