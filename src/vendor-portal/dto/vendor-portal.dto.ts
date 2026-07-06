import { IsString, IsOptional, IsEmail, IsNumber, Min } from 'class-validator';

export class VendorPortalLoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

export class SubmitQuotationDto {
  @IsString() rfqId: string;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsString() deliveryDays?: string;
  @IsOptional() @IsString() remarks?: string;
}
