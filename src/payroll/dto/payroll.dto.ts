import { IsNumber, IsOptional, IsString, IsIn, Min } from 'class-validator';

export class RunPayrollDto {
  @IsNumber() month: number;
  @IsNumber() year: number;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdatePayrollEntryDto {
  @IsOptional() @IsNumber() @Min(0) tdsAmount?: number;
  @IsOptional() @IsNumber() @Min(0) otherDeductions?: number;
  @IsOptional() @IsNumber() @Min(0) otherAllowances?: number;
  @IsOptional() @IsString() remarks?: string;
}

export class ApprovePayrollDto {
  @IsString() @IsIn(['APPROVED','PAID']) action: string;
  @IsOptional() @IsString() remarks?: string;
}
