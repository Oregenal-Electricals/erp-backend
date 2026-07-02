import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
