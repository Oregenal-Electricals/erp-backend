import { IsString, IsOptional, IsInt, IsNumber, Min } from 'class-validator';

export class CreateScrapDto {
  @IsString() workOrderId: string;
  @IsString() sourceQcInspectionId: string;
  @IsOptional() @IsString() sourceReworkId?: string;
  @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsString() defectDescription?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class DispositionScrapDto {
  @IsInt() @Min(0) scrapQty: number;
  @IsInt() @Min(0) recoveryQty: number;
  @IsOptional() @IsInt() @Min(0) otherDispositionQty?: number;
  @IsOptional() @IsNumber() @Min(0) estimatedScrapValue?: number;
  @IsOptional() @IsNumber() @Min(0) recognizedScrapRecovery?: number;
  @IsOptional() @IsString() recoveredComponents?: string;
  @IsOptional() @IsString() remarks?: string;
}
