import { VehicleType, VehiclePurpose } from '@prisma/client';
export declare class CreateVehicleDto {
    vehicleNumber: string;
    vehicleType: VehicleType;
    ownerName?: string;
    ownerMobile?: string;
    isCompanyVehicle?: boolean;
    remarks?: string;
}
export declare class UpdateVehicleDto {
    vehicleType?: VehicleType;
    ownerName?: string;
    ownerMobile?: string;
    isCompanyVehicle?: boolean;
    remarks?: string;
}
export declare class LogVehicleEntryDto {
    vehicleId: string;
    plantId: string;
    driverName: string;
    driverMobile?: string;
    driverLicense?: string;
    purpose: VehiclePurpose;
    inWeight?: number;
    materialDescription?: string;
    supplierName?: string;
    customerName?: string;
    poNumber?: string;
    remarks?: string;
    expectedExitTime?: string;
}
export declare class LogVehicleExitDto {
    outWeight?: number;
    remarks?: string;
}
