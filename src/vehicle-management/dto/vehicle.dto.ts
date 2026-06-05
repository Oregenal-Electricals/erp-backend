import {
  IsString, IsOptional, IsEnum,
  IsBoolean, IsUUID, IsNumber,
  MinLength, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType, VehiclePurpose } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty({ example: 'MH01AB1234' })
  @IsString()
  @MinLength(4)
  vehicleNumber: string;

  @ApiProperty({ enum: VehicleType, example: 'TRUCK' })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiPropertyOptional({ example: 'Rajan Transport' })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  ownerMobile?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isCompanyVehicle?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerMobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCompanyVehicle?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class LogVehicleEntryDto {
  @ApiProperty({ example: 'uuid-of-vehicle' })
  @IsUUID('4')
  vehicleId: string;

  @ApiProperty({ example: 'uuid-of-plant' })
  @IsUUID('4')
  plantId: string;

  @ApiProperty({ example: 'Suresh Kumar' })
  @IsString()
  @MinLength(2)
  driverName: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  driverMobile?: string;

  @ApiPropertyOptional({ example: 'MH1234567890' })
  @IsOptional()
  @IsString()
  driverLicense?: string;

  @ApiProperty({ enum: VehiclePurpose, example: 'INWARD' })
  @IsEnum(VehiclePurpose)
  purpose: VehiclePurpose;

  @ApiPropertyOptional({ example: 5200.5 })
  @IsOptional()
  @IsNumber()
  inWeight?: number;

  @ApiPropertyOptional({ example: 'Steel Rods - 50 bundles' })
  @IsOptional()
  @IsString()
  materialDescription?: string;

  @ApiPropertyOptional({ example: 'ABC Steel Suppliers' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({ example: 'XYZ Customer Ltd' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: 'PO-26-27-0001' })
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedExitTime?: string;
}

export class LogVehicleExitDto {
  @ApiPropertyOptional({ example: 3200.5 })
  @IsOptional()
  @IsNumber()
  outWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
