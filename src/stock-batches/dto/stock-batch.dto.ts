import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateBatchDto {
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() uom?: string;
  @IsString() warehouseId: string;
  @IsOptional() @IsString() lotNumber?: string;
  @IsOptional() @IsString() grnId?: string;
  @IsOptional() @IsString() grnItemId?: string;
  @IsOptional() @IsDateString() mfgDate?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsDateString() receivedDate?: string;
  @IsNumber() @Min(0) originalQty: number;
  @IsNumber() @Min(0) unitCost: number;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateBatchDto {
  @IsOptional() @IsString() lotNumber?: string;
  @IsOptional() @IsDateString() mfgDate?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsString() remarks?: string;
}
