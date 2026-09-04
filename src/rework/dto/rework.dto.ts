import { IsString, IsOptional, IsInt, IsNumber, Min } from 'class-validator';

export class CreateReworkDto {
  @IsString() workOrderId: string;
  @IsString() originalQcInspectionId: string;
  @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsString() defectDescription?: string;
  @IsOptional() @IsString() reworkStage?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class StartReworkDto {
  @IsInt() @Min(1) manpowerQty: number;
}

export class CompleteReworkDto {
  @IsInt() @Min(0) successfullyReworkedQty: number;
  @IsInt() @Min(0) stillDefectiveQty: number;
  @IsOptional() @IsNumber() @Min(0) additionalMaterialCost?: number;
  @IsOptional() @IsNumber() @Min(0) additionalOtherCost?: number;
  @IsOptional() @IsString() remarks?: string;
}
