import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, Min, IsIn, ValidateIf } from 'class-validator';
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
  @IsIn(['WRITTEN', 'VERBAL']) poType: string;

  // Required only for WRITTEN orders (the actual customer PO document number)
  @ValidateIf(o => o.poType === 'WRITTEN')
  @IsString()
  customerPoNumber?: string;

  // Required only for VERBAL orders
  @ValidateIf(o => o.poType === 'VERBAL')
  @IsString()
  verbalConfirmedBy?: string;

  @ValidateIf(o => o.poType === 'VERBAL')
  @IsDateString()
  verbalConfirmedDate?: string;

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

export class UpdateCpoDto {
  @IsIn(['WRITTEN', 'VERBAL']) poType: string;

  @ValidateIf(o => o.poType === 'WRITTEN')
  @IsString()
  customerPoNumber?: string;

  @ValidateIf(o => o.poType === 'VERBAL')
  @IsString()
  verbalConfirmedBy?: string;

  @ValidateIf(o => o.poType === 'VERBAL')
  @IsDateString()
  verbalConfirmedDate?: string;

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

export class CreateQuantityIncreaseDto {
  @IsIn(['WRITTEN', 'VERBAL']) poType: string;

  @ValidateIf(o => o.poType === 'WRITTEN')
  @IsString()
  customerPoNumber?: string;

  @ValidateIf(o => o.poType === 'VERBAL')
  @IsString()
  verbalConfirmedBy?: string;

  @ValidateIf(o => o.poType === 'VERBAL')
  @IsDateString()
  verbalConfirmedDate?: string;

  @IsDateString() deliveryDate: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CpoItemDto) items: CpoItemDto[];
}
