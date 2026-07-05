import { IsString, IsNumber, IsOptional, IsBoolean, IsIn, Min } from 'class-validator';

export class SaveDeclarationDto {
  @IsString() employeeId: string;
  @IsString() financialYear: string;
  @IsOptional() @IsNumber() @Min(0) section80C?: number;
  @IsOptional() @IsNumber() @Min(0) section80D?: number;
  @IsOptional() @IsNumber() @Min(0) section80G?: number;
  @IsOptional() @IsNumber() @Min(0) section80E?: number;
  @IsOptional() @IsNumber() @Min(0) otherDeductions?: number;
  @IsOptional() @IsNumber() @Min(0) rentPaid?: number;
  @IsOptional() @IsBoolean() isMetroCity?: boolean;
  @IsOptional() @IsString() @IsIn(['OLD','NEW']) regime?: string;
  @IsOptional() @IsString() remarks?: string;
}
