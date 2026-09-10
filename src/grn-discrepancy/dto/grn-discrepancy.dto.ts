import { IsString, IsNumber, IsOptional, IsIn, Min, IsArray } from 'class-validator';

const PROBLEM_TYPES = ['WRONG_MATERIAL', 'SPECIFICATION_MISMATCH', 'BATCH_MISMATCH', 'UOM_MISMATCH', 'VISIBLE_DAMAGE', 'LABEL_MISMATCH', 'MIXED_MATERIAL', 'DOCUMENT_MISMATCH', 'UNKNOWN'];
const DAMAGE_TYPES = ['PACKAGING_DAMAGED', 'MATERIAL_DAMAGED'];

export class RaiseDiscrepancyDto {
  @IsNumber() @Min(0.0001) affectedQty: number;
  @IsIn(PROBLEM_TYPES) problemType: string;
  @IsOptional() @IsIn(DAMAGE_TYPES) damageType?: string;
  @IsOptional() @IsString() physicalItemCode?: string;
  @IsOptional() @IsString() physicalItemName?: string;
  @IsOptional() @IsString() physicalSpecification?: string;
  @IsOptional() @IsString() physicalBatch?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsArray() evidence?: string[];
}

export class CorrectDiscrepancyDto {
  @IsNumber() @Min(0) affectedQty: number;
  @IsString() reason: string;
}
