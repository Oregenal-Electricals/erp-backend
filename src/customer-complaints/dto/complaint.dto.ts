import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min } from 'class-validator';

const TYPES = ['FUNCTIONAL','VISUAL','WRONG_ITEM','DAMAGED','DOCUMENTATION','PERFORMANCE'];
const SEVERITIES = ['MINOR','MAJOR','CRITICAL'];
const REQUESTS = ['REPLACEMENT','CREDIT_NOTE','REPAIR','NONE'];

export class CreateComplaintDto {
  @IsOptional() @IsString() customerId?: string;
  @IsString() customerName: string;
  @IsOptional() @IsString() customerPo?: string;
  @IsOptional() @IsString() invoiceNumber?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() batchNumber?: string;
  @IsOptional() @IsDateString() complaintDate?: string;
  @IsOptional() @IsDateString() receivedDate?: string;
  @IsString() @IsIn(TYPES) complaintType: string;
  @IsString() description: string;
  @IsOptional() @IsNumber() @Min(0) qtyAffected?: number;
  @IsOptional() @IsString() @IsIn(REQUESTS) customerRequest?: string;
  @IsString() @IsIn(SEVERITIES) severity: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateComplaintDto {
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsString() rootCause?: string;
  @IsOptional() @IsString() correctiveAction?: string;
  @IsOptional() @IsString() eighthDNumber?: string;
  @IsOptional() @IsString() @IsIn(['OPEN','INVESTIGATING','RESPONDED','CLOSED']) status?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class RespondComplaintDto {
  @IsString() rootCause: string;
  @IsString() correctiveAction: string;
  @IsOptional() @IsString() eighthDNumber?: string;
  @IsOptional() @IsString() remarks?: string;
}
