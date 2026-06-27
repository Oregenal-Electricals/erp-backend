import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class ReceiveStockDto {
  @IsString() iqcId: string;
}

export class AdjustStockDto {
  @IsString() itemCode: string;
  @IsString() warehouseId: string;
  @IsNumber() @Min(0) qty: number;
  @IsString() adjustmentType: string; // ADD, REMOVE
  @IsNumber() @Min(0) unitCost: number;
  @IsOptional() @IsString() remarks?: string;
}
