import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min } from 'class-validator';

const STAGES = ['IN_PROCESS','FINAL','INLINE'];
const RESULTS = ['PASS','FAIL','CONDITIONAL'];

export class CreateProductionQcDto {
  @IsString() workOrderId: string;
  @IsOptional() @IsString() productionEntryId?: string;
  @IsOptional() @IsString() @IsIn(STAGES) inspectionStage?: string;
  @IsOptional() @IsString() inspectorName?: string;
  @IsOptional() @IsDateString() inspectionDate?: string;
  @IsNumber() @Min(0) sampleSize: number;
  @IsNumber() @Min(0) passQty: number;
  @IsNumber() @Min(0) failQty: number;
  @IsOptional() @IsString() defectDescription?: string;
  @IsOptional() @IsString() correctiveAction?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class CompleteQcDto {
  @IsString() @IsIn(RESULTS) result: string;
  @IsOptional() @IsString() defectDescription?: string;
  @IsOptional() @IsString() correctiveAction?: string;
  @IsOptional() @IsString() remarks?: string;
}
