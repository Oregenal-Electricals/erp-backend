import { IsString, IsNumber, IsOptional, IsIn, Min, IsArray } from 'class-validator';

const PROBLEM_TYPES = ['WRONG_MATERIAL', 'SPECIFICATION_MISMATCH', 'BATCH_MISMATCH', 'UOM_MISMATCH', 'VISIBLE_DAMAGE', 'LABEL_MISMATCH', 'MIXED_MATERIAL', 'DOCUMENT_MISMATCH', 'UNKNOWN'];
const DAMAGE_TYPES = ['PACKAGING_DAMAGED', 'MATERIAL_DAMAGED'];

export class RaiseDiscrepancyDto {
  @IsNumber() @Min(0.0001) affectedQty: number;
  @IsIn(PROBLEM_TYPES) problemType: string;
  @IsOptional() @IsIn(DAMAGE_TYPES) damageType?: string;
  @IsOptional() @IsString() physicalItemCode?: string;
  @IsOptional() @IsString() physicalItemName?: string;
  @IsOptional() @IsString() physicalSpecification?: string;
  @IsOptional() @IsString() physicalBatch?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsArray() evidence?: string[];
}

export class CorrectDiscrepancyDto {
  @IsNumber() @Min(0) affectedQty: number;
  @IsString() reason: string;
}

const PURCHASE_STATUSES = ['COMMERCIALLY_ACCEPTED', 'RETURN_REQUIRED', 'REPLACEMENT_REQUIRED'];
const QC_DECISIONS = ['ACCEPTED', 'REJECTED'];
const AUTHORIZATION_RESOLUTIONS = ['ACCEPT_AUTHORIZED', 'RECLASSIFY'];
const DIRECT_RESOLUTIONS = ['RETURN_TO_VENDOR', 'REPLACE', 'HOLD_INVESTIGATION', 'OTHER'];

export class PurchaseReviewDto {
  @IsIn(PURCHASE_STATUSES) purchaseStatus: string;
  @IsOptional() @IsString() remarks?: string;
}

export class QcReviewDto {
  @IsIn(QC_DECISIONS) qcStatus: string;
  @IsOptional() @IsString() remarks?: string;
}

export class RequestResolutionDto {
  @IsIn(AUTHORIZATION_RESOLUTIONS) resolution: string;
  @IsString() reason: string;
}

export class DecideResolutionDto {
  @IsIn(['APPROVED', 'REJECTED']) action: string;
  @IsOptional() @IsString() comments?: string;
}

export class DirectResolveDto {
  @IsIn(DIRECT_RESOLUTIONS) resolution: string;
  @IsString() reason: string;
}

export { AUTHORIZATION_RESOLUTIONS, DIRECT_RESOLUTIONS };
