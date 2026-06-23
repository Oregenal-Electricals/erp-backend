import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SelectItemDto {
  @IsString() rfqItemId: string;
  @IsString() selectedVendorId: string;
  @IsString() selectedQuotationId: string;
  @IsString() selectedItemId: string;
  @IsOptional() @IsString() selectionReason?: string;
}

export class SelectVendorsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SelectItemDto)
  selections: SelectItemDto[];
}
