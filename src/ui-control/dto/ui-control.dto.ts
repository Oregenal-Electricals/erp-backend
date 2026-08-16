// erp-backend/src/ui-control/dto/ui-control.dto.ts
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const ELEMENT_TYPES = ['SIDEBAR_SECTION', 'SIDEBAR_ITEM', 'TAB', 'BUTTON', 'FIELD', 'COLUMN', 'SECTION', 'STAT_CARD'];

export class SyncElementDto {
  @IsString() key: string;
  @IsIn(ELEMENT_TYPES) elementType: string;
  @IsString() module: string;
  @IsOptional() @IsString() page?: string;
  @IsString() label: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() parentKey?: string;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() defaultVisible?: boolean;
}

export class SyncElementsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SyncElementDto)
  elements: SyncElementDto[];
}

export class CreateElementDto extends SyncElementDto {}

export class UpdateElementDto {
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() parentKey?: string;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() defaultVisible?: boolean;
}

export class ReorderItemDto {
  @IsString() id: string;
  @IsOptional() @IsString() parentKey?: string;
  @IsInt() sortOrder: number;
}

export class ReorderElementsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}

export class UpsertOverrideDto {
  @IsString() elementId: string;
  @IsIn(['ROLE', 'USER']) scopeType: 'ROLE' | 'USER';
  @IsOptional() @IsString() roleName?: string;
  @IsOptional() @IsString() userId?: string;
  @IsBoolean() isVisible: boolean;
  @IsOptional() @IsString() customLabel?: string;
  @IsOptional() @IsString() parentKeyOverride?: string;
  @IsOptional() @IsString() customPage?: string;
  @IsOptional() @IsInt() sortOrderOverride?: number;
}

export class BulkUpsertOverridesDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => UpsertOverrideDto)
  overrides: UpsertOverrideDto[];
}
