import {
  IsString, IsOptional, IsNumber,
  IsInt, IsUUID, IsDateString, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGateOutwardDto {
  @ApiProperty({ example: 'uuid-of-plant' })
  @IsUUID('4')
  plantId: string;

  @ApiPropertyOptional({ example: 'uuid-of-vehicle-log' })
  @IsOptional()
  @IsUUID('4')
  vehicleLogId?: string;

  @ApiProperty({ example: 'XYZ Customer Ltd' })
  @IsString()
  @MinLength(2)
  customerName: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  customerMobile?: string;

  @ApiPropertyOptional({ example: '123 Customer Street, Mumbai' })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional({ example: '27XYZAB1234Z1ZX' })
  @IsOptional()
  @IsString()
  customerGstin?: string;

  @ApiPropertyOptional({ example: 'SO-26-27-0001' })
  @IsOptional()
  @IsString()
  salesOrderNumber?: string;

  @ApiPropertyOptional({ example: 'DC-26-27-0001' })
  @IsOptional()
  @IsString()
  deliveryChallanNumber?: string;

  @ApiPropertyOptional({ example: 'INV-2024-001' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ example: 250000.00 })
  @IsOptional()
  @IsNumber()
  invoiceAmount?: number;

  @ApiProperty({ example: 'Finished PCB Boards - 500 nos' })
  @IsString()
  @MinLength(5)
  materialDescription: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: 'NOS' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 150.5 })
  @IsOptional()
  @IsNumber()
  grossWeight?: number;

  @ApiPropertyOptional({ example: 148.0 })
  @IsOptional()
  @IsNumber()
  netWeight?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  packageCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateGateOutwardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesOrderNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryChallanNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ApproveGateOutwardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CancelGateOutwardDto {
  @ApiProperty({ example: 'Customer cancelled order' })
  @IsString()
  @MinLength(5)
  cancelReason: string;
}
