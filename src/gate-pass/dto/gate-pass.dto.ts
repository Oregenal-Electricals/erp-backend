import {
  IsString, IsOptional, IsEnum,
  IsNumber, IsUUID, IsDateString, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GatePassType } from '@prisma/client';

export class CreateGatePassDto {
  @ApiProperty({ example: 'uuid-of-plant' })
  @IsUUID('4')
  plantId: string;

  @ApiProperty({ enum: GatePassType, example: 'RETURNABLE' })
  @IsEnum(GatePassType)
  type: GatePassType;

  @ApiProperty({ example: 'Taking laptop for client demo' })
  @IsString()
  @MinLength(5)
  purpose: string;

  @ApiProperty({ example: 'Ramesh Kumar' })
  @IsString()
  @MinLength(2)
  carrierName: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  carrierMobile?: string;

  @ApiPropertyOptional({ example: 'AADHAAR: 1234-5678-9012' })
  @IsOptional()
  @IsString()
  carrierIdProof?: string;

  @ApiPropertyOptional({ example: 'MH01AB1234' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiProperty({ example: 'Dell Laptop 15" + charger' })
  @IsString()
  @MinLength(3)
  itemDescription: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: 'NOS' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 75000 })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiPropertyOptional({ example: '2024-06-10T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ example: '2024-06-15T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  // Staff Exit Fields
  @ApiPropertyOptional({ example: 'uuid-of-employee' })
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;

  @ApiPropertyOptional({ example: 'PERSONAL', enum: ['PERSONAL','OFFICIAL','MEDICAL','EMERGENCY'] })
  @IsOptional()
  @IsString()
  exitType?: string;

  @ApiPropertyOptional({ example: '2024-06-10T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  expectedReturnTime?: string;

  @ApiPropertyOptional({ example: 'Production' })
  @IsOptional()
  @IsString()
  departmentName?: string;
}

export class ApproveGatePassDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CancelGatePassDto {
  @ApiProperty({ example: 'Request withdrawn by department' })
  @IsString()
  @MinLength(5)
  cancelReason: string;
}

export class ReturnGatePassDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
