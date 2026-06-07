import { IsString, IsOptional, IsBoolean, IsNumber, IsInt, IsObject, Min } from 'class-validator';

export class CreateRawMaterialDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() materialType?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() uomId?: string;
  @IsOptional() @IsString() hsnCode?: string;
  @IsOptional() @IsNumber() gstRate?: number;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() partNumber?: string;
  @IsOptional() @IsObject() specifications?: Record<string, any>;
  @IsOptional() @IsNumber() @Min(0) minStockLevel?: number;
  @IsOptional() @IsNumber() @Min(0) maxStockLevel?: number;
  @IsOptional() @IsNumber() @Min(0) reorderQty?: number;
  @IsOptional() @IsInt() @Min(0) leadTimeDays?: number;
}

export class UpdateRawMaterialDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() materialType?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() uomId?: string;
  @IsOptional() @IsString() hsnCode?: string;
  @IsOptional() @IsNumber() gstRate?: number;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() partNumber?: string;
  @IsOptional() @IsObject() specifications?: Record<string, any>;
  @IsOptional() @IsNumber() @Min(0) minStockLevel?: number;
  @IsOptional() @IsNumber() @Min(0) maxStockLevel?: number;
  @IsOptional() @IsNumber() @Min(0) reorderQty?: number;
  @IsOptional() @IsInt() @Min(0) leadTimeDays?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
