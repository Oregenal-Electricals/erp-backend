import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @IsString() name: string;
  @IsString() label: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() @IsString({ each: true }) permissions: string[];
}

export class UpdateRolePermissionsDto {
  @IsArray() @IsString({ each: true }) permissions: string[];
}

export class UpdateRoleDto {
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
