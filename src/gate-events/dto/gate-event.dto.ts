import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';

const EVENT_TYPES = [
  'PERSON_IN', 'PERSON_OUT', 'VEHICLE_ARRIVED', 'VEHICLE_IN', 'VEHICLE_OUT', 'VEHICLE_PREMISES_OUT',
  'VISITOR_IN', 'VISITOR_OUT', 'MATERIAL_IN', 'MATERIAL_OUT', 'DISPATCH_OUT',
  'RGP_OUT', 'RGP_RETURN', 'SCRAP_OUT', 'DENIED_ENTRY', 'EMERGENCY_ENTRY',
];
const SOURCES = ['MANUAL', 'BIOMETRIC', 'QR', 'SYSTEM'];

export class CreateGateEventDto {
  @IsString() plantId: string;
  @IsOptional() @IsString() gateId?: string;
  @IsIn(EVENT_TYPES) eventType: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() personId?: string;
  @IsOptional() @IsString() personName?: string;
  @IsOptional() @IsString() vehicleId?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsDateString() eventTime?: string;
  @IsOptional() @IsIn(SOURCES) source?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class CorrectGateEventDto {
  @IsIn(EVENT_TYPES) eventType: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() personId?: string;
  @IsOptional() @IsString() personName?: string;
  @IsOptional() @IsString() vehicleId?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsString() remarks: string; // required - must explain the correction
}
