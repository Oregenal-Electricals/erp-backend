import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePickListDto {
  @IsString() dispatchPlanId: string;
}

export class PickItemDto {
  @IsString() dispatchReservationId: string;
  @IsOptional() @IsString() batchId?: string;
  @IsNumber() @Min(0.0001) pickQty: number;
}

export class ReversePickDto {
  @IsNumber() @Min(0.0001) reverseQty: number;
  @IsOptional() @IsString() reason?: string;
}
