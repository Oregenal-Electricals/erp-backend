import { IsString, IsOptional, IsNumber, IsDateString, IsIn, IsEmail, Min } from 'class-validator';

const SOURCES = ['REFERRAL','COLD_CALL','EXHIBITION','WEBSITE','EXISTING_CUSTOMER','OTHER'];
const STATUSES = ['NEW','CONTACTED','QUALIFIED','CONVERTED','LOST'];

export class CreateLeadDto {
  @IsString() companyName: string;
  @IsString() contactPerson: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @IsIn(SOURCES) source: string;
  @IsOptional() @IsString() productInterest?: string;
  @IsOptional() @IsNumber() @Min(0) estimatedValue?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsDateString() followUpDate?: string;
  @IsOptional() @IsString() followUpNotes?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateLeadDto {
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() productInterest?: string;
  @IsOptional() @IsNumber() @Min(0) estimatedValue?: number;
  @IsOptional() @IsDateString() followUpDate?: string;
  @IsOptional() @IsString() followUpNotes?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsString() @IsIn(STATUSES) status?: string;
  @IsOptional() @IsString() lostReason?: string;
  @IsOptional() @IsString() remarks?: string;
}
