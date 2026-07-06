import { IsString, IsOptional, IsNumber, IsIn, IsIP } from 'class-validator';

const MACHINE_TYPES = ['CNC','SMT','ASSEMBLY','TESTING','CONVEYOR','INJECTION','WELDING','GENERAL'];
const STATUSES = ['ONLINE','OFFLINE','IDLE','RUNNING','ERROR','MAINTENANCE'];
const READING_TYPES = ['TEMPERATURE','SPEED','VIBRATION','CURRENT','PRESSURE','OUTPUT_COUNT','CYCLE_TIME'];

export class CreateMachineDto {
  @IsString() machineCode: string;
  @IsString() machineName: string;
  @IsOptional() @IsString() @IsIn(MACHINE_TYPES) machineType?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() manufacturer?: string;
  @IsOptional() @IsString() modelNumber?: string;
  @IsOptional() @IsString() ipAddress?: string;
  @IsOptional() @IsString() apiEndpoint?: string;
}

export class PostReadingDto {
  @IsString() machineId: string;
  @IsString() @IsIn(READING_TYPES) readingType: string;
  @IsNumber() value: number;
  @IsOptional() @IsString() unit?: string;
}

export class BulkReadingDto {
  @IsString() machineId: string;
  readings: { readingType: string; value: number; unit?: string; }[];
}

export class UpdateAlertDto {
  @IsString() @IsIn(['ACKNOWLEDGED','RESOLVED']) status: string;
}
