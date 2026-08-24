import { IsString, IsOptional, IsEmail, IsNumber, Min } from 'class-validator';

export class CreateContractorDto {
  @IsString() name: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() @Min(0) defaultHourlyRate?: number;
}

export class UpdateContractorDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() @Min(0) defaultHourlyRate?: number;
}
