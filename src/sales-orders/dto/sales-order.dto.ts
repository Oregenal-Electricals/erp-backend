import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

const SALE_TYPES = ['RM', 'SFG', 'FG'];

export class SoItemDto {
  @IsOptional() @IsString() cpoItemId?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) qty: number;
  @IsOptional() @IsString() uom?: string;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsNumber() @Min(0) gstRate?: number;
  @IsOptional() @IsString() @IsIn(SALE_TYPES) saleType?: string;
  @IsOptional() @IsString() requiredStageId?: string;
}

export class CreateSoDto {
  @IsString() cpoId: string;
  @IsDateString() deliveryDate: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SoItemDto) items: SoItemDto[];
}

export class CancelSoDto {
  @IsString() cancelReason: string;
}
