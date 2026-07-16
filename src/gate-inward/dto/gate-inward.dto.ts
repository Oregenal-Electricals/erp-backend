import {
  IsString, IsOptional, IsEnum,
  IsNumber, IsInt, IsUUID,
  IsDateString, MinLength, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class GateInwardItemDto {
  @ApiPropertyOptional({ example: 'uuid-of-po-item' })
  @IsOptional()
  @IsString()
  poItemId?: string;
  @ApiProperty({ example: 'WIR-001' })
  @IsString()
  itemCode: string;
  @ApiProperty({ example: 'Copper Wire 1.5 sqmm' })
  @IsString()
  itemName: string;
  @ApiPropertyOptional({ example: 'NOS' })
  @IsOptional()
  @IsString()
  uom?: string;
  @ApiProperty({ example: 50 })
  @IsNumber()
  quantity: number;
  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  packageCount?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
export class CreateGateInwardDto {
  @ApiProperty({ example: 'uuid-of-plant' })
  @IsUUID('4')
  plantId: string;
  @ApiPropertyOptional({ example: 'uuid-of-vehicle-log' })
  @IsOptional()
  @IsUUID('4')
  vehicleLogId?: string;
  @ApiProperty({ example: 'ABC Steel Suppliers' })
  @IsString()
  @MinLength(2)
  supplierName: string;
  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  supplierMobile?: string;
  @ApiPropertyOptional({ example: '27AABCA1234Z1ZX' })
  @IsOptional()
  @IsString()
  supplierGstin?: string;
  @ApiPropertyOptional({ example: 'uuid-of-purchase-order' })
  @IsOptional()
  @IsUUID('4')
  poId?: string;
  @ApiPropertyOptional({ example: 'PO-26-27-0001' })
  @IsOptional()
  @IsString()
  poNumber?: string;
  @ApiPropertyOptional({ example: 'INV-2024-001' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;
  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;
  @ApiPropertyOptional({ example: 125000.00 })
  @IsOptional()
  @IsNumber()
  invoiceAmount?: number;
  @ApiPropertyOptional({ example: 'MS Steel Rods 10mm - 50 bundles' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  materialDescription?: string;
  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  quantity?: number;
  @ApiPropertyOptional({ example: 'NOS' })
  @IsOptional()
  @IsString()
  unit?: string;
  @ApiPropertyOptional({ type: [GateInwardItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GateInwardItemDto)
  items?: GateInwardItemDto[];
  @ApiPropertyOptional({ example: 2500.5 })
  @IsOptional()
  @IsNumber()
  grossWeight?: number;
  @ApiPropertyOptional({ example: 2450.0 })
  @IsOptional()
  @IsNumber()
  netWeight?: number;
  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  packageCount?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
export class UpdateGateInwardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poNumber?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceNumber?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialDescription?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
export class VerifyGateInwardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
export class RejectGateInwardDto {
  @ApiProperty({ example: 'Material does not match PO description' })
  @IsString()
  @MinLength(5)
  rejectionReason: string;
}
