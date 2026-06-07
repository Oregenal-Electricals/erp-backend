import {
  IsString, IsOptional, IsEnum, IsNumber,
  IsBoolean, IsInt, IsUUID, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemType, ItemStatus } from '@prisma/client';

// ── UOM ──────────────────────────────────────────────────────
export class CreateUomDto {
  @ApiProperty({ example: 'NOS' })
  @IsString() @MinLength(1)
  code: string;

  @ApiProperty({ example: 'Numbers' })
  @IsString() @MinLength(2)
  name: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isBase?: boolean;
}

export class UpdateUomDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isBase?: boolean;
}

// ── Category ─────────────────────────────────────────────────
export class CreateCategoryDto {
  @ApiProperty({ example: 'ELEC-PCB' })
  @IsString() @MinLength(2)
  code: string;

  @ApiProperty({ example: 'PCB Components' })
  @IsString() @MinLength(2)
  name: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-of-parent-category' })
  @IsOptional() @IsUUID('4')
  parentId?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID('4') parentId?: string;
}

// ── Item ─────────────────────────────────────────────────────
export class CreateItemDto {
  @ApiProperty({ example: 'RM-PCB-001' })
  @IsString() @MinLength(2)
  itemCode: string;

  @ApiProperty({ example: 'FR4 PCB Board 100x80mm' })
  @IsString() @MinLength(3)
  itemName: string;

  @ApiPropertyOptional({ example: 'PCB 100x80' })
  @IsOptional() @IsString()
  shortName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ enum: ItemType, example: 'RAW_MATERIAL' })
  @IsEnum(ItemType)
  itemType: ItemType;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional() @IsUUID('4')
  categoryId?: string;

  @ApiProperty({ example: 'uuid-of-uom' })
  @IsUUID('4')
  uomId: string;

  @ApiPropertyOptional({ example: 'uuid-of-purchase-uom' })
  @IsOptional() @IsUUID('4')
  purchaseUomId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-sales-uom' })
  @IsOptional() @IsUUID('4')
  salesUomId?: string;

  @ApiPropertyOptional({ example: '8534.10' })
  @IsOptional() @IsString()
  hsnCode?: string;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional() @IsNumber()
  gstRate?: number;

  @ApiPropertyOptional({ example: 125.50 })
  @IsOptional() @IsNumber()
  purchaseRate?: number;

  @ApiPropertyOptional({ example: 150.00 })
  @IsOptional() @IsNumber()
  salesRate?: number;

  @ApiPropertyOptional({ example: 120.00 })
  @IsOptional() @IsNumber()
  standardCost?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional() @IsNumber()
  reorderLevel?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional() @IsNumber()
  reorderQty?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional() @IsNumber()
  minOrderQty?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional() @IsNumber()
  maxOrderQty?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional() @IsInt()
  leadTimeDays?: number;

  @ApiPropertyOptional({ example: 365 })
  @IsOptional() @IsInt()
  shelfLifeDays?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  isBatchTracked?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  isSerialTracked?: boolean;

  @ApiPropertyOptional({ example: 'DRW-PCB-001' })
  @IsOptional() @IsString()
  drawingNo?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional() @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional() @IsString()
  abcClass?: string;

  @ApiPropertyOptional({ example: 'CRITICAL' })
  @IsOptional() @IsString()
  criticalityLevel?: string;
}

export class UpdateItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() itemName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(ItemStatus) status?: ItemStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID('4') categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hsnCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() gstRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() purchaseRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salesRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() standardCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() reorderLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() reorderQty?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt()    leadTimeDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isBatchTracked?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isSerialTracked?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() drawingNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() abcClass?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() criticalityLevel?: string;
}
