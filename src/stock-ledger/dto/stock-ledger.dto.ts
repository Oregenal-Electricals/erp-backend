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
  // STORE-010 section 51-52: a direct stock adjustment must always
  // carry a reason - this was previously optional, meaning a user
  // could silently add or remove stock with nothing recorded to
  // explain why. Required, not just recommended.
  @IsString() remarks: string;
}
