import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

const ADJ_TYPES = ['INCREASE', 'DECREASE', 'RECOUNT'];
const REASONS = [
  'COUNTING_ERROR', 'UNRECORDED_LOCATION_TRANSFER', 'MATERIAL_LOSS', 'MATERIAL_FOUND',
  'INCORRECT_PREVIOUS_ISSUE', 'INCORRECT_RETURN', 'DAMAGE', 'PACKING_DIFFERENCE',
  'UOM_ERROR', 'BATCH_MISCLASSIFICATION', 'HISTORICAL_MIGRATION_DIFFERENCE', 'OTHER',
  // Legacy values kept for backward compatibility with existing records/callers.
  'EXPIRY', 'THEFT', 'FOUND', 'OPENING', 'AUDIT',
];
const STOCK_STATUSES = ['AVAILABLE', 'HOLD', 'REJECTED', 'QC_PENDING'];

export class AdjustmentItemDto {
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  // STORE-016 section 21: no systemQty here on purpose - the ERP
  // expected qty is never something the caller supplies. It is looked
  // up server-side (StockBalance for AVAILABLE, HoldStockItem for
  // HOLD, RejectedStockItem for REJECTED) at the moment of create(),
  // exactly like STORE-012's previous-material-status reconciliation
  // never trusts a caller-supplied "already issued" figure either.
  @IsNumber() @Min(0) physicalQty: number;
  @IsNumber() @Min(0) unitCost: number;
  @IsOptional() @IsIn(STOCK_STATUSES) status?: string;
  @IsOptional() @IsString() binId?: string;
  @IsOptional() @IsString() batchId?: string;
}

export class CreateAdjustmentDto {
  @IsString() warehouseId: string;
  @IsString() @IsIn(ADJ_TYPES) adjustmentType: string;
  @IsString() @IsIn(REASONS) reason: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => AdjustmentItemDto) items: AdjustmentItemDto[];
}
