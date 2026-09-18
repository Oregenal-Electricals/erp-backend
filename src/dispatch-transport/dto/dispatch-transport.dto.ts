import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateTransportAssignmentDto {
  @IsString() dispatchPlanId: string;
  @IsOptional() @IsIn(['TRANSPORTER_VEHICLE', 'OWN_VEHICLE', 'CUSTOMER_PICKUP']) transportType?: string;
  @IsOptional() @IsString() transporterName?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() vehicleType?: string;
  @IsOptional() @IsString() driverName?: string;
  @IsOptional() @IsString() driverPhone?: string;
  @IsOptional() @IsString() lrNumber?: string;
}

export class AssignPackageDto {
  @IsString() packageId: string;
}

export class ReassignVehicleDto {
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() vehicleType?: string;
  @IsOptional() @IsString() driverName?: string;
  @IsOptional() @IsString() driverPhone?: string;
  @IsString() reason: string;
}

export class CancelAssignmentDto {
  @IsOptional() @IsString() reason?: string;
}
