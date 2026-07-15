import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfirmImportItemDto {
  @IsOptional() @IsString() partCode?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() package?: string;
  @IsNumber() quantity: number;
  @IsString() uom: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() preferredMake?: string;
  @IsOptional() @IsString() alternateMakes?: string;
  @IsOptional() @IsString() rawMaterialId?: string; // set if matched to an existing raw material
}

export class ConfirmImportSectionDto {
  @IsString() name: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ConfirmImportItemDto)
  items: ConfirmImportItemDto[];
}

export class ConfirmImportProductDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() description?: string;
}

export class ConfirmBomImportDto {
  @IsOptional() @IsString() useExistingProductId?: string;
  @ValidateNested() @Type(() => ConfirmImportProductDto)
  product: ConfirmImportProductDto;
  @IsOptional() @IsString() bomVersion?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ConfirmImportSectionDto)
  sections: ConfirmImportSectionDto[];
}
