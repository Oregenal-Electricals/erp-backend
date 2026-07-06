import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsIn, Min, IsArray } from 'class-validator';

export class CreateProgramDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() @IsIn(['SAFETY','TECHNICAL','SOFT_SKILLS','COMPLIANCE','INDUCTION']) category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) durationHours?: number;
  @IsOptional() @IsBoolean() isMandatory?: boolean;
  @IsOptional() @IsNumber() @Min(0) validityMonths?: number;
  @IsOptional() @IsString() targetDesignation?: string;
  @IsOptional() @IsString() targetDepartment?: string;
}

export class CreateSessionDto {
  @IsString() trainingProgramId: string;
  @IsString() title: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsString() venue?: string;
  @IsOptional() @IsString() trainer?: string;
  @IsOptional() @IsNumber() @Min(1) maxParticipants?: number;
  @IsOptional() @IsString() remarks?: string;
}

export class EnrollDto {
  @IsString() sessionId: string;
  @IsArray() employeeIds: string[];
}

export class MarkAttendanceDto {
  @IsArray() records: { enrollmentId: string; attended: boolean; }[];
}

export class UpdateEnrollmentDto {
  @IsOptional() @IsNumber() @Min(0) score?: number;
  @IsOptional() @IsBoolean() passed?: boolean;
  @IsOptional() @IsString() remarks?: string;
}
