import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChangeRequestType } from '@prisma/client';

export class CreateChangeRequestDto {
  @ApiProperty({ example: 'Update Company GST Number' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'Need to update GSTIN from 27AABCA1234Z1ZX to new number',
  })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ enum: ChangeRequestType, example: 'MASTER_DATA' })
  @IsEnum(ChangeRequestType)
  type: ChangeRequestType;

  @ApiPropertyOptional({
    example: 'NORMAL',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: '2025-03-31' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateChangeRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({ enum: ChangeRequestType })
  @IsOptional()
  @IsEnum(ChangeRequestType)
  type?: ChangeRequestType;

  @ApiPropertyOptional({ enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class ReviewChangeRequestDto {
  @ApiProperty({ example: 'Approved. Please proceed with the change.' })
  @IsString()
  @MinLength(5)
  reviewComment: string;
}

export class AddCommentDto {
  @ApiProperty({ example: 'I have attached the supporting documents.' })
  @IsString()
  @MinLength(2)
  comment: string;
}
