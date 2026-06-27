import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsArray,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'EMP0002' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  employeeCode?: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'john.doe@acmeelectronics.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Welcome@1234' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])/, {
    message:
      'Password must contain at least one uppercase letter and one number',
  })
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.VIEWER })
  @IsEnum(UserRole, { message: 'Invalid role' })
  role: UserRole;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  additionalRoles?: UserRole[];

  @ApiProperty({ example: 'aaba1738-6e81-44f7-b630-aa0327620870' })
  @IsUUID('4', { message: 'companyId must be a valid UUID' })
  companyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mustChangePwd?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'EMP0002' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  employeeCode?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid role' })
  role?: UserRole;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'NewPass@1234' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])/, {
    message:
      'Password must contain at least one uppercase letter and one number',
  })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass@1234' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewPass@1234' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])/, {
    message:
      'Password must contain at least one uppercase letter and one number',
  })
  newPassword: string;
}
