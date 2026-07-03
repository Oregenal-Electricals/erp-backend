import { IsString, IsOptional, IsIn } from 'class-validator';

export class GenerateGstReturnDto {
  @IsString() @IsIn(['GSTR1','GSTR3B']) returnType: string;
  @IsString() period: string; // YYYY-MM
  @IsOptional() @IsString() remarks?: string;
}

export class FileGstReturnDto {
  @IsOptional() @IsString() remarks?: string;
}
