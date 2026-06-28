import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

const ADJ_TYPES = ['INCREASE','DECREASE','RECOUNT'];
const REASONS = ['DAMAGE','EXPIRY','THEFT','FOUND','OPENING','AUDIT','OTHER'];

export class AdjustmentItemDto {
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) systemQty: number;
  @IsNumber() @Min(0) physicalQty: number;
  @IsNumber() @Min(0) unitCost: number;
}

export class CreateAdjustmentDto {
  @IsString() warehouseId: string;
  @IsString() @IsIn(ADJ_TYPES) adjustmentType: string;
  @IsString() @IsIn(REASONS) reason: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => AdjustmentItemDto) items: AdjustmentItemDto[];
}
