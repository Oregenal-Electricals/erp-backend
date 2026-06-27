import { IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export class CreateLandedCostDto {
  @IsString() ipoId: string;
  @IsOptional() @IsNumber() @Min(0) invoiceValue?: number;
  @IsOptional() @IsNumber() @Min(0) customsDuty?: number;
  @IsOptional() @IsNumber() @Min(0) freightCharges?: number;
  @IsOptional() @IsNumber() @Min(0) chaCharges?: number;
  @IsOptional() @IsNumber() @Min(0) portCharges?: number;
  @IsOptional() @IsNumber() @Min(0) bankCharges?: number;
  @IsOptional() @IsNumber() @Min(0) insuranceCharges?: number;
  @IsOptional() @IsNumber() @Min(0) otherCharges?: number;
  @IsOptional() @IsString() @IsIn(['BY_VALUE','BY_WEIGHT','BY_QTY']) allocationMethod?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateLandedCostDto {
  @IsOptional() @IsNumber() @Min(0) invoiceValue?: number;
  @IsOptional() @IsNumber() @Min(0) customsDuty?: number;
  @IsOptional() @IsNumber() @Min(0) freightCharges?: number;
  @IsOptional() @IsNumber() @Min(0) chaCharges?: number;
  @IsOptional() @IsNumber() @Min(0) portCharges?: number;
  @IsOptional() @IsNumber() @Min(0) bankCharges?: number;
  @IsOptional() @IsNumber() @Min(0) insuranceCharges?: number;
  @IsOptional() @IsNumber() @Min(0) otherCharges?: number;
  @IsOptional() @IsString() @IsIn(['BY_VALUE','BY_WEIGHT','BY_QTY']) allocationMethod?: string;
  @IsOptional() @IsString() notes?: string;
}
