import { IsString, IsOptional, IsDateString, IsNumber, IsBoolean, IsIn, Min } from 'class-validator';

const STATUSES = ['PRESENT','ABSENT','HALF_DAY','HOLIDAY','WEEK_OFF','LEAVE'];

export class CreateShiftDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsString() startTime: string;
  @IsString() endTime: string;
  @IsNumber() @Min(0) shiftHours: number;
  @IsOptional() @IsString() lunchStartTime?: string;
  @IsOptional() @IsString() lunchEndTime?: string;
  @IsOptional() @IsNumber() @Min(0) lunchMinutes?: number;
  @IsOptional() @IsString() weeklyOff?: string;
  @IsOptional() @IsNumber() @Min(0) otMultiplier?: number;
  @IsOptional() @IsNumber() @Min(0) holidayMultiplier?: number;
}

export class MarkAttendanceDto {
  @IsString() employeeId: string;
  @IsDateString() attendanceDate: string;
  @IsOptional() @IsString() shiftId?: string;
  @IsOptional() @IsString() checkIn?: string;
  @IsOptional() @IsString() checkOut?: string;
  @IsOptional() @IsString() lunchOut?: string;
  @IsOptional() @IsString() lunchIn?: string;
  @IsOptional() @IsString() @IsIn(STATUSES) status?: string;
  @IsOptional() @IsBoolean() isHoliday?: boolean;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateAttendanceDto {
  @IsOptional() @IsString() shiftId?: string;
  @IsOptional() @IsString() checkIn?: string;
  @IsOptional() @IsString() checkOut?: string;
  @IsOptional() @IsString() lunchOut?: string;
  @IsOptional() @IsString() lunchIn?: string;
  @IsOptional() @IsString() @IsIn(STATUSES) status?: string;
  @IsOptional() @IsBoolean() isHoliday?: boolean;
  @IsOptional() @IsString() remarks?: string;
}

export class BulkAttendanceDto {
  @IsDateString() attendanceDate: string;
  @IsOptional() @IsString() shiftId?: string;
  records: {
    employeeId: string;
    checkIn?: string;
    checkOut?: string;
    lunchOut?: string;
    lunchIn?: string;
    status?: string;
    isHoliday?: boolean;
    remarks?: string;
  }[];
}
