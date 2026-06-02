import { IsString, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateFinancialYearDto {
  @ApiProperty({ example: 'FY2025-26' })
  @IsString()
  code: string;

  @ApiProperty({ example: '2025-2026' })
  @IsString()
  label: string;

  @ApiProperty({ example: '2025-04-01' })
  @IsDateString({}, { message: 'startDate must be a valid date (YYYY-MM-DD)' })
  startDate: string;

  @ApiProperty({ example: '2026-03-31' })
  @IsDateString({}, { message: 'endDate must be a valid date (YYYY-MM-DD)' })
  endDate: string;

  @ApiProperty({ example: 'aaba1738-6e81-44f7-b630-aa0327620870' })
  @IsUUID('4', { message: 'companyId must be a valid UUID' })
  companyId: string;
}

export class UpdateFinancialYearDto extends PartialType(
  CreateFinancialYearDto,
) {}
