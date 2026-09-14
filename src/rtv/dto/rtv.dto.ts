import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

const RTV_REASONS = [
  'IQC_FAILED', 'WRONG_SPECIFICATION', 'DAMAGE', 'WRONG_MATERIAL',
  'SUPPLIER_QUALITY_REJECTION', 'EXCESS_MATERIAL_RETURN', 'OTHER',
];

export class RequestRtvDto {
  @IsString() rejectedStockItemId: string;
  @IsNumber() @Min(0.0001) requestedQty: number;
  @IsString() @IsIn(RTV_REASONS) reason: string;
  @IsOptional() @IsString() remarks?: string;
}

export class DecideRtvDto {
  @IsString() @IsIn(['AUTHORIZED', 'REJECTED']) action: string;
  @IsOptional() @IsNumber() @Min(0) approvedQty?: number;
  @IsOptional() @IsString() comments?: string;
}

export class PrepareRtvDto {
  @IsNumber() @Min(0.0001) preparedQty: number;
}

export class GateOutRtvDto {
  @IsNumber() @Min(0.0001) qty: number;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() challanNumber?: string;
  @IsOptional() @IsString() remarks?: string;
}
