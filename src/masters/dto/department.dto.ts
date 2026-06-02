import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'DEPT-ENG' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Product Engineering & R&D' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  headName?: string;

  @ApiProperty({ example: 'aaba1738-6e81-44f7-b630-aa0327620870' })
  @IsUUID('4', { message: 'companyId must be a valid UUID' })
  companyId: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
