import { IsString, IsOptional, IsNumber, IsDateString, IsArray, IsInt, IsIn, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PoItemDto {
  @IsOptional() @IsInt() sequence?: number;
  @IsOptional() @IsString() prItemId?: string;
  @IsOptional() @IsString() quotationItemId?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() hsnCode?: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) orderedQty: number;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsNumber() @Min(0) taxRate?: number;
}

export class CreatePurchaseOrderDto {
  @IsOptional() @IsString() rfqId?: string;
  @IsString() vendorId: string;
  @IsOptional() @IsString() prId?: string;
  @IsDateString() deliveryDate: string;
  @IsOptional() @IsString() deliveryAddress?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() termsConditions?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PoItemDto) items?: PoItemDto[];
}

export class UpdatePurchaseOrderDto {
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsOptional() @IsString() deliveryAddress?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() termsConditions?: string;
}

export class UpdatePoItemDto {
  @IsOptional() @IsNumber() @Min(0) orderedQty?: number;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsNumber() @Min(0) taxRate?: number;
  @IsOptional() @IsString() hsnCode?: string;
}
