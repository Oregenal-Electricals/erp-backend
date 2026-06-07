import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, Min, Max } from 'class-validator';

export class CreateVendorDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() vendorType?: string;
  @IsOptional() @IsString() gstin?: string;
  @IsOptional() @IsString() pan?: string;
  @IsOptional() @IsString() msmeNumber?: string;
  @IsOptional() @IsBoolean() isMsme?: boolean;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() alternatePhone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() addressLine1?: string;
  @IsOptional() @IsString() addressLine2?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() pincode?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() billingAddress?: string;
  @IsOptional() @IsString() shippingAddress?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() bankBranch?: string;
  @IsOptional() @IsString() accountNumber?: string;
  @IsOptional() @IsString() ifscCode?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsNumber() creditLimit?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() tdsApplicable?: boolean;
  @IsOptional() @IsString() tdsSection?: string;
  @IsOptional() @IsNumber() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateVendorDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() vendorType?: string;
  @IsOptional() @IsString() gstin?: string;
  @IsOptional() @IsString() pan?: string;
  @IsOptional() @IsString() msmeNumber?: string;
  @IsOptional() @IsBoolean() isMsme?: boolean;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() alternatePhone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() addressLine1?: string;
  @IsOptional() @IsString() addressLine2?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() pincode?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() billingAddress?: string;
  @IsOptional() @IsString() shippingAddress?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() bankBranch?: string;
  @IsOptional() @IsString() accountNumber?: string;
  @IsOptional() @IsString() ifscCode?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsNumber() creditLimit?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() tdsApplicable?: boolean;
  @IsOptional() @IsString() tdsSection?: string;
  @IsOptional() @IsNumber() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
