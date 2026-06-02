import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'ACME002' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Acme Electronics Pvt Ltd' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Acme Electronics Private Limited' })
  @IsString()
  @MinLength(2)
  legalName: string;

  @ApiPropertyOptional({ example: 'AABCA1234Z' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'Invalid PAN format. Example: AABCA1234Z',
  })
  pan?: string;

  @ApiPropertyOptional({ example: 'MUMA12345A' })
  @IsOptional()
  @IsString()
  tan?: string;

  @ApiPropertyOptional({ example: 'U12345MH2020PTC123456' })
  @IsOptional()
  @IsString()
  cin?: string;

  @ApiPropertyOptional({ example: '27AABCA1234Z1ZX' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GSTIN format. Example: 27AABCA1234Z1ZX',
  })
  gstin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  msmeNumber?: string;

  @ApiProperty({ example: '123 Industrial Area, Andheri East' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  state: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: '400069' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Pincode must be exactly 6 digits' })
  pincode: string;

  @ApiPropertyOptional({ example: '+91-22-12345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@company.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @ApiPropertyOptional({ example: 'https://www.company.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
