import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString, IsInt, IsIn, Min, Max } from 'class-validator';

export class CreateBomDto {
  @IsString() productId: string;
  @IsOptional() @IsString() revisionId?: string;
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() effectiveFrom?: string;
  @IsOptional() @IsDateString() effectiveTo?: string;
}

export class UpdateBomDto {
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() effectiveFrom?: string;
  @IsOptional() @IsDateString() effectiveTo?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateBomItemDto {
  @IsOptional() @IsInt() @Min(1) sequence?: number;
  @IsOptional() @IsString() @IsIn(['RAW_MATERIAL', 'COMPONENT', 'SUB_ASSEMBLY']) itemType?: string;
  @IsOptional() @IsString() rawMaterialId?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) quantity: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) wastagePercent?: number;
  @IsOptional() @IsNumber() @Min(0) unitCost?: number;
  @IsOptional() @IsBoolean() isCritical?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateBomItemDto {
  @IsOptional() @IsInt() @Min(1) sequence?: number;
  @IsOptional() @IsString() @IsIn(['RAW_MATERIAL', 'COMPONENT', 'SUB_ASSEMBLY']) itemType?: string;
  @IsOptional() @IsString() rawMaterialId?: string;
  @IsOptional() @IsString() itemCode?: string;
  @IsOptional() @IsString() itemName?: string;
  @IsOptional() @IsString() uom?: string;
  @IsOptional() @IsNumber() @Min(0) quantity?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) wastagePercent?: number;
  @IsOptional() @IsNumber() @Min(0) unitCost?: number;
  @IsOptional() @IsBoolean() isCritical?: boolean;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
