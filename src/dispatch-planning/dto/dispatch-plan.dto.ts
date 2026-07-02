import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PlanItemDto {
  @IsString() soItemId: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsNumber() @Min(0) plannedQty: number;
  @IsOptional() @IsString() uom?: string;
}

export class CreateDispatchPlanDto {
  @IsString() soId: string;
  @IsDateString() plannedDate: string;
  @IsOptional() @IsString() deliveryAddress?: string;
  @IsOptional() @IsString() @IsIn(['ROAD','RAIL','AIR','COURIER']) transportMode?: string;
  @IsOptional() @IsString() transporterName?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() driverName?: string;
  @IsOptional() @IsString() driverPhone?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PlanItemDto) items: PlanItemDto[];
}

export class CancelPlanDto {
  @IsString() cancelReason: string;
}
