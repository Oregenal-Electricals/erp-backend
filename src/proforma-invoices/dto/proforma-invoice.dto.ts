import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PiItemDto {
  @IsOptional() @IsNumber() sequence?: number;
  @IsOptional() @IsString() ipoItemId?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() hsnCode?: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) qty: number;
  @IsNumber() @Min(0) unitPriceForeign: number;
}

export class CreateProformaInvoiceDto {
  @IsString() ipoId: string;
  @IsOptional() @IsString() vendorPiNumber?: string;
  @IsOptional() @IsDateString() piDate?: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() bankAddress?: string;
  @IsOptional() @IsString() swiftCode?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PiItemDto) items?: PiItemDto[];
}

export class UpdateProformaInvoiceDto {
  @IsOptional() @IsString() vendorPiNumber?: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() bankAddress?: string;
  @IsOptional() @IsString() swiftCode?: string;
  @IsOptional() @IsString() notes?: string;
}

export class RejectPiDto {
  @IsString() rejectionReason: string;
}
