import { IsString, IsOptional, IsBoolean, IsInt, IsIn, IsArray, Min } from 'class-validator';

const MODULES = ['BOM', 'VENDOR', 'PRODUCT', 'RAW_MATERIAL', 'ITEM', 'PRICE_LIST'];
const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'DROPDOWN'];

export class CreateCustomFieldDefinitionDto {
  @IsString() @IsIn(MODULES) module: string;
  @IsString() fieldKey: string;
  @IsString() fieldLabel: string;
  @IsOptional() @IsString() @IsIn(FIELD_TYPES) fieldType?: string;
  @IsOptional() @IsArray() options?: string[];
  @IsOptional() @IsString() placeholder?: string;
  @IsOptional() @IsString() defaultValue?: string;
  @IsOptional() @IsBoolean() isRequired?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class UpdateCustomFieldDefinitionDto {
  @IsOptional() @IsString() fieldLabel?: string;
  @IsOptional() @IsString() @IsIn(FIELD_TYPES) fieldType?: string;
  @IsOptional() @IsArray() options?: string[];
  @IsOptional() @IsString() placeholder?: string;
  @IsOptional() @IsString() defaultValue?: string;
  @IsOptional() @IsBoolean() isRequired?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

// No validation — values is dynamic key-value map
export class SaveCustomFieldValuesDto {
  values: Record<string, string>;
}
