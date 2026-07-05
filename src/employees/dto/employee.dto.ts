import { IsString, IsOptional, IsEmail, IsDateString, IsNumber, IsIn, Min } from 'class-validator';

const EMP_TYPES = ['PERMANENT','CONTRACT','PROBATION','INTERN'];
const GENDERS = ['MALE','FEMALE','OTHER'];
const STATUSES = ['ACTIVE','INACTIVE','RESIGNED','TERMINATED'];

export class CreateDepartmentDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() headUserId?: string;
}

export class CreateDesignationDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() grade?: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateEmployeeDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsString() phone: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsDateString() dateOfJoining: string;
  @IsString() departmentId: string;
  @IsString() designationId: string;
  @IsOptional() @IsString() reportingManagerId?: string;
  @IsOptional() @IsString() @IsIn(EMP_TYPES) employmentType?: string;
  @IsOptional() @IsString() @IsIn(GENDERS) gender?: string;
  @IsOptional() @IsString() panNumber?: string;
  @IsOptional() @IsString() aadharNumber?: string;
  @IsOptional() @IsString() pfNumber?: string;
  @IsOptional() @IsString() esiNumber?: string;
  @IsOptional() @IsString() bankAccountNumber?: string;
  @IsOptional() @IsString() bankIfscCode?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsNumber() @Min(0) basicSalary?: number;
  @IsOptional() @IsNumber() @Min(0) hraAmount?: number;
  @IsOptional() @IsNumber() @Min(0) conveyanceAmount?: number;
  @IsOptional() @IsNumber() @Min(0) otherAllowances?: number;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() pincode?: string;
  @IsOptional() @IsString() emergencyContact?: string;
  @IsOptional() @IsString() emergencyPhone?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateEmployeeDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() designationId?: string;
  @IsOptional() @IsString() reportingManagerId?: string;
  @IsOptional() @IsString() @IsIn(EMP_TYPES) employmentType?: string;
  @IsOptional() @IsNumber() @Min(0) basicSalary?: number;
  @IsOptional() @IsNumber() @Min(0) hraAmount?: number;
  @IsOptional() @IsNumber() @Min(0) conveyanceAmount?: number;
  @IsOptional() @IsNumber() @Min(0) otherAllowances?: number;
  @IsOptional() @IsString() @IsIn(STATUSES) status?: string;
  @IsOptional() @IsDateString() dateOfLeaving?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() pincode?: string;
  @IsOptional() @IsString() panNumber?: string;
  @IsOptional() @IsString() pfNumber?: string;
  @IsOptional() @IsString() esiNumber?: string;
  @IsOptional() @IsString() bankAccountNumber?: string;
  @IsOptional() @IsString() bankIfscCode?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() emergencyContact?: string;
  @IsOptional() @IsString() emergencyPhone?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() remarks?: string;
}
