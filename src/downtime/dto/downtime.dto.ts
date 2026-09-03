import { IsString, IsOptional, IsDateString } from 'class-validator';

export class PauseDto {
  @IsString() workOrderId: string;
  @IsString() reason: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsDateString() startTime?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class ResumeDto {
  @IsOptional() @IsDateString() endTime?: string;
  @IsOptional() @IsString() remarks?: string;
}
