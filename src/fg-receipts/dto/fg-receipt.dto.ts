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
