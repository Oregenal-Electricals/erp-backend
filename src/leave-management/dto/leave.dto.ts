import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsIn, Min } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsNumber() @Min(0) daysAllowed: number;
  @IsOptional() @IsBoolean() isPaid?: boolean;
  @IsOptional() @IsBoolean() carryForward?: boolean;
  @IsOptional() @IsNumber() @Min(0) maxCarryForward?: number;
  @IsOptional() @IsString() @IsIn(['ALL','MALE','FEMALE']) applicableGender?: string;
  @IsOptional() @IsBoolean() requiresApproval?: boolean;
  @IsOptional() @IsString() description?: string;
}

export class AllocateLeaveDto {
  @IsString() employeeId: string;
  @IsString() leaveTypeId: string;
  @IsNumber() year: number;
  @IsNumber() @Min(0) allocated: number;
  @IsOptional() @IsNumber() @Min(0) carryForward?: number;
}

export class ApplyLeaveDto {
  @IsString() leaveTypeId: string;
  @IsDateString() fromDate: string;
  @IsDateString() toDate: string;
  @IsString() reason: string;
  @IsOptional() @IsString() remarks?: string;
}

export class ApproveLeaveDto {
  @IsString() @IsIn(['APPROVED','REJECTED']) action: string;
  @IsOptional() @IsString() rejectionReason?: string;
  @IsOptional() @IsString() remarks?: string;
}
