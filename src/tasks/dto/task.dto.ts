import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'];
const CATEGORIES = ['QUALITY','PURCHASE','SALES','FINANCE','PRODUCTION','GENERAL'];

export class CreateTaskDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsString() assignedTo: string;
  @IsDateString() dueDate: string;
  @IsOptional() @IsString() @IsIn(PRIORITIES) priority?: string;
  @IsOptional() @IsString() @IsIn(CATEGORIES) category?: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() referenceNumber?: string;
}

export class UpdateTaskDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() @IsIn(PRIORITIES) priority?: string;
  @IsOptional() @IsString() @IsIn(CATEGORIES) category?: string;
}

export class UpdateTaskStatusDto {
  @IsString() @IsIn(['OPEN','IN_PROGRESS','COMPLETED','CANCELLED']) status: string;
  @IsOptional() @IsString() completionNote?: string;
}

export class AddCommentDto {
  @IsString() comment: string;
}
