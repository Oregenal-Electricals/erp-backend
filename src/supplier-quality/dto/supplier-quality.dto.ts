import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min, Max } from 'class-validator';

export class CreateSupplierRatingDto {
  @IsString() vendorId: string;
  @IsString() period: string;
  @IsOptional() @IsString() @IsIn(['MONTHLY','QUARTERLY']) periodType?: string;
  @IsNumber() @Min(0) totalReceived: number;
  @IsNumber() @Min(0) totalRejected: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) onTimeDelivery?: number;
  @IsOptional() @IsString() remarks?: string;
}

export class CreateCarDto {
  @IsString() vendorId: string;
  @IsOptional() @IsString() ncrId?: string;
  @IsString() description: string;
  @IsOptional() @IsString() @IsIn(['MINOR','MAJOR','CRITICAL']) severity?: string;
  @IsDateString() dueDate: string;
  @IsOptional() @IsString() remarks?: string;
}

export class RespondCarDto {
  @IsString() supplierResponse: string;
  @IsString() supplierRootCause: string;
  @IsString() supplierAction: string;
}

export class VerifyCarDto {
  @IsOptional() @IsString() remarks?: string;
}
