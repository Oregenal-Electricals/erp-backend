import { IsString, IsOptional, IsBoolean, IsNumber, IsIn, Min, Max } from 'class-validator';

export class CreateHsnSacDto {
  @IsString() code: string;
  @IsOptional() @IsString() @IsIn(['HSN', 'SAC']) codeType?: string;
  @IsString() description: string;
  @IsNumber() @Min(0) @Max(28) gstRate: number;
  @IsOptional() @IsNumber() @Min(0) cessRate?: number;
}

export class UpdateHsnSacDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @IsIn(['HSN', 'SAC']) codeType?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(28) gstRate?: number;
  @IsOptional() @IsNumber() @Min(0) cessRate?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
