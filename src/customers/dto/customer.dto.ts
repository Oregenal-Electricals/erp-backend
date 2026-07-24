import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomerAddressDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() addressType?: string;
  @IsString() addressLine: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() pincode?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class CustomerContactDto {
  @IsOptional() @IsString() id?: string;
  @IsString() name: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class CustomerGstDto {
  @IsOptional() @IsString() id?: string;
  @IsString() gstNumber: string;
  @IsOptional() @IsString() branchLabel?: string;
}

export class CreateCustomerDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CustomerAddressDto)
  addresses?: CustomerAddressDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CustomerContactDto)
  contacts?: CustomerContactDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CustomerGstDto)
  gstNumbers?: CustomerGstDto[];
}

export class UpdateCustomerDto extends CreateCustomerDto {}
