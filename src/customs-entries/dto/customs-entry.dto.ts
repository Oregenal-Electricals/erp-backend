import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateCustomsEntryDto {
  @IsString() ipoId: string;
  @IsString() shipmentId: string;
  @IsOptional() @IsString() customsBoeNumber?: string;
  @IsOptional() @IsString() chaName?: string;
  @IsOptional() @IsString() portOfEntry?: string;
  @IsNumber() @Min(0) cifValue: number;
  @IsOptional() @IsNumber() @Min(0) bcdRate?: number;
  @IsOptional() @IsNumber() @Min(0) igstRate?: number;
  @IsOptional() @IsNumber() @Min(0) aidcAmount?: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateCustomsEntryDto {
  @IsOptional() @IsString() customsBoeNumber?: string;
  @IsOptional() @IsString() chaName?: string;
  @IsOptional() @IsString() portOfEntry?: string;
  @IsOptional() @IsNumber() @Min(0) cifValue?: number;
  @IsOptional() @IsNumber() @Min(0) bcdRate?: number;
  @IsOptional() @IsNumber() @Min(0) igstRate?: number;
  @IsOptional() @IsNumber() @Min(0) aidcAmount?: number;
  @IsOptional() @IsString() notes?: string;
}

export class AssessCustomsEntryDto {
  @IsNumber() @Min(0) cifValue: number;
  @IsNumber() @Min(0) bcdRate: number;
  @IsNumber() @Min(0) igstRate: number;
  @IsOptional() @IsNumber() @Min(0) aidcAmount?: number;
  @IsOptional() @IsString() customsBoeNumber?: string;
}
