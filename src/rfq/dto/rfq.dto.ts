import { IsString, IsOptional, IsDateString, IsArray, IsIn } from 'class-validator';

export class CreateRfqDto {
  @IsString() prId: string;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() responseDeadline: string;
  @IsOptional() @IsString() deliveryLocation?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() vendorIds?: string[];
  @IsOptional() @IsArray() prItemIds?: string[];
}

export class UpdateRfqDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() responseDeadline?: string;
  @IsOptional() @IsString() deliveryLocation?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() notes?: string;
}

export class AddRfqVendorDto {
  @IsString() vendorId: string;
}

export class AddRfqItemDto {
  @IsOptional() @IsString() prItemId?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsOptional() requiredQty?: number;
  @IsOptional() @IsString() notes?: string;
}
