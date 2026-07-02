import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

const TYPES = ['SALES_INVOICE','RECEIPT','PURCHASE_BILL','PAYMENT','JOURNAL','CREDIT_NOTE','DEBIT_NOTE'];

export class VoucherEntryDto {
  @IsString() accountId: string;
  @IsString() @IsIn(['DEBIT','CREDIT']) entryType: string;
  @IsNumber() @Min(0) amount: number;
  @IsOptional() @IsString() narration?: string;
}

export class CreateVoucherDto {
  @IsString() @IsIn(TYPES) voucherType: string;
  @IsOptional() @IsDateString() voucherDate?: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() referenceNumber?: string;
  @IsOptional() @IsString() partyName?: string;
  @IsOptional() @IsString() narration?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => VoucherEntryDto) entries: VoucherEntryDto[];
}

export class CancelVoucherDto {
  @IsString() cancelReason: string;
}
