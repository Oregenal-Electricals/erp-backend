import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BankStatementLineDto {
  @IsDateString() transactionDate: string;
  @IsString() description: string;
  @IsOptional() @IsString() referenceNumber?: string;
  @IsOptional() @IsNumber() @Min(0) debitAmount?: number;
  @IsOptional() @IsNumber() @Min(0) creditAmount?: number;
  @IsOptional() @IsNumber() balance?: number;
}

export class CreateBankStatementDto {
  @IsString() bankAccountId: string;
  @IsString() bankAccountName: string;
  @IsString() period: string; // YYYY-MM
  @IsNumber() openingBalance: number;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => BankStatementLineDto) lines: BankStatementLineDto[];
}

export class ReconcileLineDto {
  @IsString() lineId: string;
  @IsOptional() @IsString() voucherEntryId?: string;
}
