import { IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export class ApprovePoDto {
  @IsOptional() @IsString() remarks?: string;
}

export class RejectPoDto {
  @IsString() remarks: string;
}

export class CreateApprovalSettingDto {
  @IsNumber() @Min(1) level: number;
  @IsString() levelName: string;
  @IsOptional() @IsNumber() @Min(0) minAmount?: number;
  @IsOptional() @IsNumber() maxAmount?: number;
}

export class UpdateApprovalSettingDto {
  @IsOptional() @IsString() levelName?: string;
  @IsOptional() @IsNumber() @Min(0) minAmount?: number;
  @IsOptional() @IsNumber() maxAmount?: number;
  @IsOptional() isActive?: boolean;
}
