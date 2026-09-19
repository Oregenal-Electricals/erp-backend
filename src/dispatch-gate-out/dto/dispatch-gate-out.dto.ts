import { IsString, IsOptional } from 'class-validator';

export class ConfirmGateOutDto {
  @IsString() dispatchConfirmationId: string;
  @IsOptional() @IsString() actualVehicleNumber?: string;
}
