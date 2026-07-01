import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateCapaDto {
  @IsString() ncrId: string;
  @IsOptional() @IsString() rootCause?: string;
  @IsString() correctiveAction: string;
  @IsOptional() @IsString() preventiveAction?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsDateString() dueDate: string;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateCapaDto {
  @IsOptional() @IsString() rootCause?: string;
  @IsOptional() @IsString() correctiveAction?: string;
  @IsOptional() @IsString() preventiveAction?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() @IsIn(['ASSIGNED','IN_PROGRESS','COMPLETED','VERIFIED']) status?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class VerifyCapaDto {
  @IsString() effectivenessCheck: string;
}
