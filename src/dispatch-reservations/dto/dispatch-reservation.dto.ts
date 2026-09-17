import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateReservationDto {
  @IsString() dispatchPlanItemId: string;
  @IsNumber() @Min(0.0001) requestedQty: number;
}

export class ReleaseReservationDto {
  @IsNumber() @Min(0.0001) releaseQty: number;
  @IsOptional() @IsString() reason?: string;
}
