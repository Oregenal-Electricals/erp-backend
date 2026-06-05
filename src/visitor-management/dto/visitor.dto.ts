import {
  IsString, IsOptional, IsEnum,
  IsEmail, IsUUID, IsDateString,
  MinLength, MaxLength, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IdProofType } from '@prisma/client';

export class CreateVisitorDto {
  @ApiProperty({ example: 'Rajesh' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Kumar' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter valid 10-digit mobile number' })
  mobile: string;

  @ApiPropertyOptional({ example: 'rajesh@vendor.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Vendor Electronics Ltd' })
  @IsOptional()
  @IsString()
  visitorCompany?: string;

  @ApiPropertyOptional({ example: 'Sales Manager' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiProperty({ enum: IdProofType, example: 'AADHAAR' })
  @IsEnum(IdProofType)
  idProofType: IdProofType;

  @ApiProperty({ example: '1234-5678-9012' })
  @IsString()
  @MinLength(4)
  idProofNumber: string;
}

export class UpdateVisitorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitorCompany?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;
}

export class CheckInVisitorDto {
  @ApiProperty({ example: 'uuid-of-visitor' })
  @IsUUID('4')
  visitorId: string;

  @ApiProperty({ example: 'uuid-of-plant' })
  @IsUUID('4')
  plantId: string;

  @ApiPropertyOptional({ example: 'uuid-of-host-employee' })
  @IsOptional()
  @IsUUID('4')
  hostEmployeeId?: string;

  @ApiProperty({ example: 'Business meeting with purchase team' })
  @IsString()
  @MinLength(5)
  purpose: string;

  @ApiPropertyOptional({ example: 'MH01AB1234' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: 'Laptop, Documents' })
  @IsOptional()
  @IsString()
  itemsCarried?: string;

  @ApiPropertyOptional({ example: 'Purchase Dept, Conference Room' })
  @IsOptional()
  @IsString()
  areasToVisit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedOutTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CheckOutVisitorDto {
  @ApiPropertyOptional({ example: 'Completed meeting, returned laptop' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
