import { IsString, IsIn, IsOptional } from 'class-validator';

export class RequestOverrideDto {
  @IsString() workOrderId: string;
  @IsString() reason: string;
}

export class DecideOverrideDto {
  @IsString() @IsIn(['APPROVED', 'REJECTED']) action: string;
  @IsOptional() @IsString() comments?: string;
}
