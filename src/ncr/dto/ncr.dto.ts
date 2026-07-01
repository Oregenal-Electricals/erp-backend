import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min } from 'class-validator';

const SOURCES = ['IQC','IPQC','OQC','CUSTOMER_COMPLAINT','INTERNAL_AUDIT','SUPPLIER','INTERNAL'];
const SEVERITIES = ['MINOR','MAJOR','CRITICAL'];
const DISPOSITIONS = ['USE_AS_IS','REWORK','SCRAP','RETURN_TO_VENDOR'];

export class CreateNcrDto {
  @IsString() @IsIn(SOURCES) source: string;
  @IsOptional() @IsString() sourceReferenceId?: string;
  @IsOptional() @IsString() sourceReferenceNumber?: string;
  @IsOptional() @IsString() itemCode?: string;
  @IsOptional() @IsString() itemName?: string;
  @IsOptional() @IsString() workOrderId?: string;
  @IsString() description: string;
  @IsString() @IsIn(SEVERITIES) severity: string;
  @IsOptional() @IsNumber() @Min(0) qtyAffected?: number;
  @IsOptional() @IsString() detectedBy?: string;
  @IsOptional() @IsDateString() detectedDate?: string;
  @IsOptional() @IsString() @IsIn(DISPOSITIONS) disposition?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateNcrDto {
  @IsOptional() @IsString() @IsIn(DISPOSITIONS) disposition?: string;
  @IsOptional() @IsString() remarks?: string;
}
