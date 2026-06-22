import { IsString, IsOptional, IsNumber, IsDateString, IsInt, Min } from 'class-validator';

export class CreateVendorQuotationDto {
  @IsString() rfqId: string;
  @IsString() vendorId: string;
  @IsDateString() validUntil: string;
  @IsOptional() @IsInt() @Min(1) deliveryDays?: number;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateVendorQuotationDto {
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsInt() @Min(1) deliveryDays?: number;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateQuotationItemDto {
  @IsOptional() @IsString() rfqItemId?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) requiredQty: number;
  @IsNumber() @Min(0) quotedQty: number;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsNumber() @Min(0) taxRate?: number;
  @IsOptional() @IsInt() @Min(0) deliveryDays?: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateQuotationItemDto {
  @IsOptional() @IsNumber() @Min(0) quotedQty?: number;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsNumber() @Min(0) taxRate?: number;
  @IsOptional() @IsInt() @Min(0) deliveryDays?: number;
  @IsOptional() @IsString() notes?: string;
}
