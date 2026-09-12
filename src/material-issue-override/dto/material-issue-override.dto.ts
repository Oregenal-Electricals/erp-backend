import { IsString, IsIn, IsOptional, IsNumber, Min } from 'class-validator';

export class RequestOverrideDto {
  @IsString() workOrderId: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsNumber() @Min(0.0001) requestedQty: number;
  @IsString() reason: string;
}

export class DecideOverrideDto {
  @IsString() @IsIn(['APPROVED', 'REJECTED']) action: string;
  // Required when action is APPROVED (validated in the service, not
  // here, since it depends on the sibling field) - the qty Management
  // is actually granting, which may be less than what was requested.
  @IsOptional() @IsNumber() @Min(0) approvedQty?: number;
  @IsOptional() @IsString() comments?: string;
}
