import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min, IsInt } from 'class-validator';

const INSTRUMENT_TYPES = ['LC', 'TT', 'DP', 'DA'];

export class CreatePaymentInstrumentDto {
  @IsString() ipoId: string;
  @IsOptional() @IsString() piId?: string;
  @IsString() @IsIn(INSTRUMENT_TYPES) instrumentType: string;
  @IsString() bankName: string;
  @IsOptional() @IsString() bankReference?: string;
  @IsOptional() @IsString() vendorBankName?: string;
  @IsOptional() @IsString() vendorSwiftCode?: string;
  @IsNumber() @Min(0) amount: number;
  @IsNumber() @Min(0) amountInr: number;
  @IsOptional() @IsDateString() issueDate?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsDateString() latestShipmentDate?: string;
  @IsOptional() @IsInt() @Min(0) presentationDays?: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdatePaymentInstrumentDto {
  @IsOptional() @IsString() bankReference?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsDateString() latestShipmentDate?: string;
  @IsOptional() @IsInt() @Min(0) presentationDays?: number;
  @IsOptional() @IsString() notes?: string;
}
