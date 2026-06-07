import { IsString, IsOptional, IsBoolean, IsNumber, IsInt, IsObject, Min } from 'class-validator';

export class CreateProductDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() productType?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() uomId?: string;
  @IsOptional() @IsString() hsnCode?: string;
  @IsOptional() @IsNumber() gstRate?: number;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() revision?: string;
  @IsOptional() @IsString() drawingNumber?: string;
  @IsOptional() @IsObject() specifications?: Record<string, any>;
  @IsOptional() @IsNumber() @Min(0) minOrderQty?: number;
  @IsOptional() @IsInt() @Min(0) leadTimeDays?: number;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() productType?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() uomId?: string;
  @IsOptional() @IsString() hsnCode?: string;
  @IsOptional() @IsNumber() gstRate?: number;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() revision?: string;
  @IsOptional() @IsString() drawingNumber?: string;
  @IsOptional() @IsObject() specifications?: Record<string, any>;
  @IsOptional() @IsNumber() @Min(0) minOrderQty?: number;
  @IsOptional() @IsInt() @Min(0) leadTimeDays?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
