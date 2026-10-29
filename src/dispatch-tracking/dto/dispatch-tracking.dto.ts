import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';

export const DISPATCH_TRACKING_STATUSES = ['IN_TRANSIT', 'DELAYED', 'DELIVERED'] as const;

export class CreateTrackingUpdateDto {
  @IsString() gateOutId: string;
  @IsIn(DISPATCH_TRACKING_STATUSES) status: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() eventAt?: string;
  @IsOptional() @IsString() carrierReference?: string;
}

export class UpdateTrackingUpdateDto {
  @IsOptional() @IsIn(DISPATCH_TRACKING_STATUSES) status?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() eventAt?: string;
  @IsOptional() @IsString() carrierReference?: string;
}
