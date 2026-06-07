import {
  IsString, IsOptional, IsEnum,
  IsBoolean, IsNumber, IsUUID, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarehouseType } from '@prisma/client';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'uuid-of-plant' })
  @IsUUID('4') plantId: string;

  @ApiProperty({ example: 'WH-RM-01' })
  @IsString() @MinLength(2) code: string;

  @ApiProperty({ example: 'Raw Material Store' })
  @IsString() @MinLength(2) name: string;

  @ApiProperty({ enum: WarehouseType, example: 'RAW_MATERIAL' })
  @IsEnum(WarehouseType) type: WarehouseType;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacity?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateWarehouseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(WarehouseType) type?: WarehouseType;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacity?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class CreateZoneDto {
  @ApiProperty({ example: 'uuid-of-warehouse' })
  @IsUUID('4') warehouseId: string;

  @ApiProperty({ example: 'ZONE-A' })
  @IsString() @MinLength(1) code: string;

  @ApiProperty({ example: 'Zone A — General Storage' })
  @IsString() @MinLength(2) name: string;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ example: 'AMBIENT' }) @IsOptional() @IsString() temperature?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isHazmat?: boolean;
}

export class CreateRackDto {
  @ApiProperty({ example: 'uuid-of-zone' })
  @IsUUID('4') zoneId: string;

  @ApiProperty({ example: 'RACK-01' })
  @IsString() @MinLength(1) code: string;

  @ApiProperty({ example: 'Rack 01' })
  @IsString() @MinLength(2) name: string;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxWeight?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxVolume?: number;
}

export class CreateBinDto {
  @ApiProperty({ example: 'uuid-of-rack' })
  @IsUUID('4') rackId: string;

  @ApiProperty({ example: 'BIN-A1' })
  @IsString() @MinLength(1) code: string;

  @ApiProperty({ example: 'Bin A1' })
  @IsString() @MinLength(2) name: string;

  @ApiPropertyOptional({ example: 'STORAGE' }) @IsOptional() @IsString() binType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxQty?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
