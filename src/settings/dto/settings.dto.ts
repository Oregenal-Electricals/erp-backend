import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class UpdateSystemSettingDto {
  @ApiProperty({ example: 'Smart Manufacturing ERP' })
  @IsString()
  value: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class BulkUpdateSettingsDto {
  @ApiProperty({
    example: { app_name: 'Smart ERP', timezone: 'Asia/Kolkata' },
  })
  settings: Record<string, string>;
}

export class CreateNumberingSeriesDto {
  @ApiProperty({ example: 'aaba1738-6e81-44f7-b630-aa0327620870' })
  @IsUUID('4')
  companyId: string;

  @ApiProperty({
    example: 'PO',
    description: 'Document type: PO, GRN, INV, WO, DC',
  })
  @IsString()
  @MaxLength(10)
  documentType: string;

  @ApiProperty({ example: 'PO' })
  @IsString()
  @MaxLength(10)
  prefix: string;

  @ApiPropertyOptional({ example: '-', default: '-' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  separator?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  includeYear?: boolean;

  @ApiPropertyOptional({
    example: 'YY-YY',
    description: 'YY-YY = 24-25, YYYY = 2025',
  })
  @IsOptional()
  @IsString()
  yearFormat?: string;

  @ApiPropertyOptional({ example: 4, description: 'Digit padding: 4 = 0001' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  padding?: number;
}

export class UpdateNumberingSeriesDto extends PartialType(
  CreateNumberingSeriesDto,
) {}
