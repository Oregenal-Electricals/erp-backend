import { IsString, IsIn, IsOptional, IsNumber, Min } from 'class-validator';

const REASON_CATEGORIES = [
  'PROCESS_REJECTION', 'MATERIAL_DAMAGE', 'PRODUCTION_LOSS', 'REWORK',
  'BOM_CHANGE', 'SHORT_ISSUE_CORRECTION', 'TRIAL_TESTING', 'APPROVED_QTY_INCREASE', 'OTHER',
];

export class RequestAdditionalMaterialDto {
  @IsString() workOrderId: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsNumber() @Min(0.0001) requestedQty: number;
  @IsString() @IsIn(REASON_CATEGORIES) reasonCategory: string;
  @IsString() reason: string;
}

export class DecideAdditionalMaterialDto {
  @IsString() @IsIn(['APPROVED', 'REJECTED']) action: string;
  @IsOptional() @IsNumber() @Min(0) approvedQty?: number;
  @IsOptional() @IsString() comments?: string;
}
