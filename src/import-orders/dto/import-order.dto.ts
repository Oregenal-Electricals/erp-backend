import { IsString, IsOptional, IsNumber, IsDateString, IsArray, IsIn, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

const INCOTERMS = ['FOB', 'CIF', 'EXW', 'CFR', 'DDP', 'FCA', 'CPT', 'CIP'];
const PAYMENT_MODES = ['LC', 'TT', 'DP', 'DA'];

export class ImportPoItemDto {
  @IsOptional() @IsNumber() sequence?: number;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() hsnCode?: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) orderedQty: number;
  @IsNumber() @Min(0) unitPriceForeign: number;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsNumber() @Min(0) taxRate?: number;
  @IsOptional() @IsNumber() @Min(0) bcdRate?: number;
}

export class CreateImportPoDto {
  @IsString() vendorId: string;
  @IsOptional() @IsString() prId?: string;
  @IsDateString() deliveryDate: string;
  @IsOptional() @IsString() currency?: string;
  @IsNumber() @Min(0) exchangeRate: number;
  @IsOptional() @IsString() @IsIn(INCOTERMS) incoterms?: string;
  @IsOptional() @IsString() portOfLoading?: string;
  @IsOptional() @IsString() portOfDischarge?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() @IsIn(PAYMENT_MODES) paymentMode?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() termsConditions?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ImportPoItemDto) items?: ImportPoItemDto[];
}

export class UpdateImportPoDto {
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsOptional() @IsNumber() @Min(0) exchangeRate?: number;
  @IsOptional() @IsString() portOfLoading?: string;
  @IsOptional() @IsString() portOfDischarge?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() notes?: string;
}
