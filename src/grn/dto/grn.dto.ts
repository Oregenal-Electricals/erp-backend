import { IsString, IsOptional, IsNumber, IsDateString, IsIn, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GrnItemDto {
  @IsOptional() @IsString() poItemId?: string;
  @IsOptional() @IsString() ipoItemId?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) orderedQty: number;
  @IsNumber() @Min(0) previouslyReceived: number;
  @IsNumber() @Min(0) receivedQty: number;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsNumber() @Min(0) landedCostPerUnit?: number;
}

export class CreateGrnDto {
  @IsString() @IsIn(['DOMESTIC', 'IMPORT']) grnType: string;
  @IsOptional() @IsString() poId?: string;
  @IsOptional() @IsString() ipoId?: string;
  @IsOptional() @IsString() gateInwardEntryId?: string;
  @IsOptional() @IsString() landedCostId?: string;
  @IsString() warehouseId: string;
  @IsOptional() @IsDateString() receivedDate?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() dcNumber?: string;
  @IsOptional() @IsString() invoiceNumber?: string;
  @IsOptional() @IsDateString() invoiceDate?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => GrnItemDto) items: GrnItemDto[];
}

export class UpdateGrnDto {
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() dcNumber?: string;
  @IsOptional() @IsString() invoiceNumber?: string;
  @IsOptional() @IsDateString() invoiceDate?: string;
  @IsOptional() @IsString() remarks?: string;
}
