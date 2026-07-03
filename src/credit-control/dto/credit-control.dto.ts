import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';

export class CreateCreditLimitDto {
  @IsString() customerName: string;
  @IsNumber() @Min(0) creditLimit: number;
  @IsOptional() @IsInt() @Min(0) creditDays?: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateCreditLimitDto {
  @IsOptional() @IsNumber() @Min(0) creditLimit?: number;
  @IsOptional() @IsInt() @Min(0) creditDays?: number;
  @IsOptional() @IsString() notes?: string;
}

export class ReleaseCreditHoldDto {
  @IsString() releaseReason: string;
}

export class CheckCreditDto {
  @IsString() customerName: string;
  @IsNumber() @Min(0) orderAmount: number;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() referenceNumber?: string;
}
