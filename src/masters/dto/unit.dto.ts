import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty({ example: 'UNIT-SMT-02' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'SMT Line 2' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Surface Mount Technology Line 2' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ['PRODUCTION', 'WAREHOUSE', 'OFFICE', 'UTILITY'],
    default: 'PRODUCTION',
  })
  @IsOptional()
  @IsString()
  unitType?: string;

  @ApiProperty({ example: '99efc65b-436b-4c20-918b-bd672218d826' })
  @IsUUID('4', { message: 'plantId must be a valid UUID' })
  plantId: string;
}

export class UpdateUnitDto extends PartialType(CreateUnitDto) {}
