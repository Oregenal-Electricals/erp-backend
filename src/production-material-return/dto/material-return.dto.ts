import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

const RETURN_REASONS = [
  'UNUSED_MATERIAL', 'EXCESS_ISSUED', 'WO_COMPLETED', 'STAGE_COMPLETED',
  'MATERIAL_NOT_REQUIRED', 'WRONG_MATERIAL_ISSUED', 'CHANGE_IN_PLAN',
  'BALANCE_RETURN', 'REJECTED_MATERIAL', 'OTHER',
  // Legacy values kept for backward compatibility with existing records/callers.
  'EXCESS_UNUSED',
];
const RETURN_CONDITIONS = ['GOOD', 'DAMAGED', 'SUSPECT'];

export class CreateMaterialReturnDto {
  @IsString() workOrderId: string;
  @IsString() warehouseId: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsNumber() @Min(0.0001) qty: number;
  @IsOptional() @IsIn(RETURN_REASONS) reason?: string;
  // STORE-014 section 9: what Store actually finds on physical receipt -
  // only GOOD goes toward Available; anything else routes to Hold.
  @IsOptional() @IsIn(RETURN_CONDITIONS) condition?: string;
  // STORE-014 section 5: links this return to the exact original issue
  // line, so the returnable-qty ceiling has something concrete to
  // validate against. Optional for backward compatibility with a
  // return that can't be traced to one specific line, but strongly
  // preferred - an untraceable return still validates qty against the
  // item's total outstanding custody across all its issues.
  @IsOptional() @IsString() originalIssueItemId?: string;
  // STORE-015: which bin the good material is actually placed into on
  // receipt. Optional - if omitted, the bin-level location view simply
  // isn't updated for this return (StockBalance/HoldStock, the
  // authoritative records, are updated regardless).
  @IsOptional() @IsString() destinationBinId?: string;
  @IsOptional() @IsString() remarks?: string;
}
