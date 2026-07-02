import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CpoItemDto {
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) qty: number;
  @IsOptional() @IsString() uom?: string;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsNumber() @Min(0) gstRate?: number;
}

export class CreateCpoDto {
  @IsString() customerPoNumber: string;
  @IsOptional() @IsString() quotationId?: string;
  @IsString() customerName: string;
  @IsOptional() @IsString() customerEmail?: string;
  @IsOptional() @IsString() customerPhone?: string;
  @IsOptional() @IsString() deliveryAddress?: string;
  @IsDateString() poDate: string;
  @IsDateString() deliveryDate: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CpoItemDto) items: CpoItemDto[];
}

export class CancelCpoDto {
  @IsString() cancelReason: string;
}
