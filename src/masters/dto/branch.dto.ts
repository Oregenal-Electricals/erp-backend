import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ example: 'BRN-DEL-01' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Delhi Branch' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '07AABCA1234Z1ZX' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GSTIN format',
  })
  gstin?: string;

  @ApiProperty({ example: '789 Connaught Place' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'New Delhi' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  state: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: '110001' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Pincode must be exactly 6 digits' })
  pincode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @ApiPropertyOptional({
    enum: ['SALES', 'OFFICE', 'WAREHOUSE'],
    default: 'SALES',
  })
  @IsOptional()
  @IsString()
  branchType?: string;

  @ApiProperty({ example: 'aaba1738-6e81-44f7-b630-aa0327620870' })
  @IsUUID('4', { message: 'companyId must be a valid UUID' })
  companyId: string;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {}
