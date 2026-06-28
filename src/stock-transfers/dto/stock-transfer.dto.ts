import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) qty: number;
  @IsNumber() @Min(0) unitCost: number;
  @IsOptional() @IsString() batchId?: string;
}

export class CreateTransferDto {
  @IsString() @IsIn(['INTER_WAREHOUSE','INTRA_WAREHOUSE']) transferType: string;
  @IsString() fromWarehouseId: string;
  @IsString() toWarehouseId: string;
  @IsOptional() @IsString() fromBinId?: string;
  @IsOptional() @IsString() toBinId?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => TransferItemDto) items: TransferItemDto[];
}
