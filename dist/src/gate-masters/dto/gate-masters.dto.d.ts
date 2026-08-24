export declare class CreateGateTypeDto {
    code: string;
    name: string;
    description?: string;
}
export declare class UpdateGateTypeDto {
    name?: string;
    description?: string;
    isActive?: boolean;
}
export declare class CreateGateDto {
    plantId: string;
    gateTypeId?: string;
    code: string;
    name: string;
}
export declare class UpdateGateDto {
    gateTypeId?: string;
    name?: string;
    isActive?: boolean;
}
export declare class CreateParkingAreaDto {
    plantId: string;
    code: string;
    name: string;
    areaType: string;
    totalSlots?: number;
}
export declare class UpdateParkingAreaDto {
    name?: string;
    areaType?: string;
    totalSlots?: number;
    isActive?: boolean;
}
export declare class CreateParkingSlotDto {
    parkingAreaId: string;
    slotCode: string;
    vehicleType?: string;
    isReserved?: boolean;
}
export declare class UpdateParkingSlotDto {
    vehicleType?: string;
    isReserved?: boolean;
    isActive?: boolean;
}
export declare class CreateVisitPurposeDto {
    code: string;
    name: string;
}
export declare class UpdateVisitPurposeDto {
    name?: string;
    isActive?: boolean;
}
export declare class CreateGatePassTypeMasterDto {
    code: string;
    name: string;
    mapsToType: string;
}
export declare class UpdateGatePassTypeMasterDto {
    name?: string;
    mapsToType?: string;
    isActive?: boolean;
}
export declare class CreateSecurityReasonDto {
    code: string;
    name: string;
    category?: string;
}
export declare class UpdateSecurityReasonDto {
    name?: string;
    category?: string;
    isActive?: boolean;
}
