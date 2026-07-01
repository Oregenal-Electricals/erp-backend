import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min } from 'class-validator';

const RESULTS = ['PASS','FAIL','CONDITIONAL','PENDING'];
const CHECKS = ['PASS','FAIL','NA'];

export class CreateOqcDto {
  @IsOptional() @IsString() fgReceiptId?: string;
  @IsOptional() @IsString() workOrderId?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() uom?: string;
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() lotNumber?: string;
  @IsOptional() @IsString() batchNumber?: string;
  @IsOptional() @IsString() inspectorName?: string;
  @IsOptional() @IsDateString() inspectionDate?: string;
  @IsNumber() @Min(0) sampleSize: number;
  @IsNumber() @Min(0) passQty: number;
  @IsNumber() @Min(0) failQty: number;
  @IsOptional() @IsString() @IsIn(CHECKS) visualCheck?: string;
  @IsOptional() @IsString() @IsIn(CHECKS) dimensionalCheck?: string;
  @IsOptional() @IsString() @IsIn(CHECKS) functionalCheck?: string;
  @IsOptional() @IsString() @IsIn(CHECKS) packagingCheck?: string;
  @IsOptional() @IsString() @IsIn(CHECKS) labellingCheck?: string;
  @IsOptional() @IsString() @IsIn(RESULTS) result?: string;
  @IsOptional() @IsString() defectsFound?: string;
  @IsOptional() @IsString() cocNumber?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class CompleteOqcDto {
  @IsString() @IsIn(['PASS','FAIL','CONDITIONAL']) result: string;
  @IsOptional() @IsString() defectsFound?: string;
  @IsOptional() @IsString() cocNumber?: string;
  @IsOptional() @IsString() remarks?: string;
}
