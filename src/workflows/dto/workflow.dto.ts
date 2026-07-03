import { IsString, IsOptional, IsNumber, IsInt, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowStepDto {
  @IsInt() @Min(1) level: number;
  @IsString() stepName: string;
  @IsOptional() @IsString() approverUserId?: string;
  @IsOptional() @IsInt() timeoutHours?: number;
}

export class CreateWorkflowDto {
  @IsString() name: string;
  @IsString() documentType: string;
  @IsOptional() @IsString() @IsIn(['ALWAYS','ABOVE_AMOUNT']) triggerCondition?: string;
  @IsOptional() @IsNumber() @Min(0) triggerAmount?: number;
  @IsOptional() @IsString() description?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => WorkflowStepDto) steps: WorkflowStepDto[];
}

export class SubmitForApprovalDto {
  @IsString() documentType: string;
  @IsString() documentId: string;
  @IsString() documentNumber: string;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() remarks?: string;
}

export class ApproveRejectDto {
  @IsString() @IsIn(['APPROVED','REJECTED']) action: string;
  @IsOptional() @IsString() comments?: string;
}
