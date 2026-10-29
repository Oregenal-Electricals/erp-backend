import { IsString, IsOptional, IsNumber, IsDateString, IsArray, IsIn, ValidateNested, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class PrItemDto {
  @IsOptional() @IsNumber() sequence?: number;
  @IsOptional() @IsString() @IsIn(['RAW_MATERIAL', 'ITEM', 'OTHER']) itemType?: string;
  @IsOptional() @IsString() rawMaterialId?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() description?: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) requiredQty: number;
  @IsOptional() @IsNumber() @Min(0) estimatedUnitPrice?: number;
  @IsOptional() @IsString() hsnCode?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreatePurchaseRequisitionDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() requiredDate: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']) priority?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PrItemDto) items?: PrItemDto[];
}

export class UpdatePurchaseRequisitionDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() requiredDate?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']) priority?: string;
  @IsOptional() @IsString() notes?: string;
}

export class RejectPrDto {
  @IsString() rejectionReason: string;
}

// Auto-drafts a Purchase Requisition straight from OPEN MaterialShortage
// records (the Customer PO shortage check's output). itemCodes selects
// which shortage-driven items to pull in; every item's requiredQty is set
// strictly from the shortfall quantity (BOM/demand requirement minus
// stock/incoming already netted off by the shortage check) - never the
// full BOM requirement - and the PR lands in DRAFT so Purchase can still
// review/edit quantities before submit()/approve(). Nothing here raises
// a PO or sends anything to a vendor.
export class CreatePrFromShortageDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() requiredDate: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']) priority?: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) itemCodes: string[];
}
