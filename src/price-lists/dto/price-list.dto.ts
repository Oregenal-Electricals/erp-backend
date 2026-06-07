import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString, IsIn, Min } from 'class-validator';

export class CreatePriceListDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @IsIn(['SALES', 'PURCHASE']) listType?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdatePriceListDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreatePriceListItemDto {
  @IsString() @IsIn(['PRODUCT', 'RAW_MATERIAL', 'ITEM']) itemType: string;
  @IsString() itemId: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() uom?: string;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsNumber() @Min(0) minQty?: number;
  @IsOptional() @IsDateString() validFrom?: string;
  @IsOptional() @IsDateString() validTo?: string;
}

export class UpdatePriceListItemDto {
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsNumber() @Min(0) minQty?: number;
  @IsOptional() @IsDateString() validFrom?: string;
  @IsOptional() @IsDateString() validTo?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
