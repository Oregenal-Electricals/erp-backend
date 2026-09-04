import { IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export class CreateFgReceiptDto {
  @IsString() workOrderId: string;
  @IsString() warehouseId: string;
  @IsNumber() @Min(0) receivedQty: number;
  @IsOptional() @IsNumber() @Min(0) rejectedQty?: number;
  @IsOptional() @IsString() batchNumber?: string;
  @IsOptional() @IsNumber() @Min(0) unitCost?: number;
  @IsOptional() @IsString() remarks?: string;
}

// PROD-017: handover sourced from a ProductionQc acceptance decision
// (first-pass or rework re-inspection) rather than raw WorkOrder
// completedQty - does not require the WO to be COMPLETED.
export class CreateFgReceiptFromQcDto {
  @IsString() productionQcId: string;
  @IsString() warehouseId: string;
  @IsNumber() @Min(0.0001) qty: number;
  @IsOptional() @IsString() batchNumber?: string;
  @IsOptional() @IsNumber() @Min(0) unitCost?: number;
  @IsOptional() @IsString() remarks?: string;
}
