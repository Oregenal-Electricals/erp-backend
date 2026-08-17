import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateProductFamilyDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdateProductFamilyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class AssignProductsToFamilyDto {
  @IsString({ each: true }) productIds: string[];
}
