import { IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class UpdateCostSheetDto {
  @IsOptional() @IsNumber() @Min(0) laborHours?: number;
  @IsOptional() @IsNumber() @Min(0) laborRatePerHour?: number;
  @IsOptional() @IsNumber() @Min(0) laborCost?: number;
  @IsOptional() @IsNumber() @Min(0) overheadCost?: number;
  @IsOptional() @IsString() overheadRemarks?: string;
  @IsOptional() @IsNumber() @Min(0) otherCost?: number;
  @IsOptional() @IsString() otherRemarks?: string;
  @IsOptional() @IsString() remarks?: string;
}
