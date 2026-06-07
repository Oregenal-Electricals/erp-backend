import { WarehouseType } from '@prisma/client';
export declare class CreateWarehouseDto {
    plantId: string;
    code: string;
    name: string;
    type: WarehouseType;
    description?: string;
    address?: string;
    capacity?: number;
    isDefault?: boolean;
}
export declare class UpdateWarehouseDto {
    name?: string;
    type?: WarehouseType;
    description?: string;
    capacity?: number;
    isDefault?: boolean;
}
export declare class CreateZoneDto {
    warehouseId: string;
    code: string;
    name: string;
    description?: string;
    temperature?: string;
    isHazmat?: boolean;
}
export declare class CreateRackDto {
    zoneId: string;
    code: string;
    name: string;
    description?: string;
    maxWeight?: number;
    maxVolume?: number;
}
export declare class CreateBinDto {
    rackId: string;
    code: string;
    name: string;
    binType?: string;
    maxQty?: number;
    description?: string;
}
