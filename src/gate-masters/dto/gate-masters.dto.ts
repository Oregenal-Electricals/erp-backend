import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class CreateGateTypeDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
}
export class UpdateGateTypeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateGateDto {
  @IsString() plantId: string;
  @IsOptional() @IsString() gateTypeId?: string;
  @IsString() code: string;
  @IsString() name: string;
}
export class UpdateGateDto {
  @IsOptional() @IsString() gateTypeId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateParkingAreaDto {
  @IsString() plantId: string;
  @IsString() code: string;
  @IsString() name: string;
  @IsString() areaType: string;
  @IsOptional() @IsInt() @Min(0) totalSlots?: number;
}
export class UpdateParkingAreaDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() areaType?: string;
  @IsOptional() @IsInt() @Min(0) totalSlots?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateParkingSlotDto {
  @IsString() parkingAreaId: string;
  @IsString() slotCode: string;
  @IsOptional() @IsString() vehicleType?: string;
  @IsOptional() @IsBoolean() isReserved?: boolean;
}
export class UpdateParkingSlotDto {
  @IsOptional() @IsString() vehicleType?: string;
  @IsOptional() @IsBoolean() isReserved?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateVisitPurposeDto {
  @IsString() code: string;
  @IsString() name: string;
}
export class UpdateVisitPurposeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateGatePassTypeMasterDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsString() mapsToType: string; // RETURNABLE, NON_RETURNABLE, STAFF_EXIT
}
export class UpdateGatePassTypeMasterDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() mapsToType?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateSecurityReasonDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() category?: string;
}
export class UpdateSecurityReasonDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
