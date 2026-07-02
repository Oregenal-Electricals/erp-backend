import { IsString, IsOptional, IsNumber, IsDateString, IsIn, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QuotationItemDto {
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) qty: number;
  @IsOptional() @IsString() uom?: string;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) discount?: number;
  @IsOptional() @IsNumber() @Min(0) gstRate?: number;
}

export class CreateQuotationDto {
  @IsOptional() @IsString() leadId?: string;
  @IsString() customerName: string;
  @IsOptional() @IsString() customerEmail?: string;
  @IsOptional() @IsString() customerPhone?: string;
  @IsOptional() @IsString() customerAddress?: string;
  @IsDateString() validUntil: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() termsConditions?: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => QuotationItemDto) items: QuotationItemDto[];
}

export class UpdateQuotationDto {
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() customerEmail?: string;
  @IsOptional() @IsString() customerPhone?: string;
  @IsOptional() @IsString() customerAddress?: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsString() termsConditions?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => QuotationItemDto) items?: QuotationItemDto[];
}

export class RejectQuotationDto {
  @IsString() rejectedReason: string;
}
