import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DispatchItemDto {
  @IsOptional() @IsString() planItemId?: string;
  @IsString() soItemId: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsNumber() @Min(0) dispatchedQty: number;
  @IsOptional() @IsString() uom?: string;
  @IsOptional() @IsNumber() unitPrice?: number;
  @IsOptional() @IsNumber() gstRate?: number;
}

export class CreateDispatchDto {
  @IsString() planId: string;
  @IsOptional() @IsDateString() dispatchDate?: string;
  @IsOptional() @IsString() deliveryAddress?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() transporterName?: string;
  @IsOptional() @IsString() driverName?: string;
  @IsOptional() @IsString() driverPhone?: string;
  @IsOptional() @IsString() lrNumber?: string;
  @IsOptional() @IsString() ewayBillNumber?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => DispatchItemDto) items: DispatchItemDto[];
}
