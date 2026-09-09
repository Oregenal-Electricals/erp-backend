import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

export class CreateMaterialReturnDto {
  @IsString() workOrderId: string;
  @IsString() warehouseId: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsNumber() @Min(0.0001) qty: number;
  @IsOptional() @IsIn(['EXCESS_UNUSED', 'REJECTED_MATERIAL', 'OTHER']) reason?: string;
  @IsOptional() @IsString() remarks?: string;
}
