import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min } from 'class-validator';
const SHIFTS = ['MORNING','EVENING','NIGHT'];
export class CreateProductionEntryDto {
  @IsString() workOrderId: string;
  @IsOptional() @IsDateString() entryDate?: string;
  @IsOptional() @IsString() @IsIn(SHIFTS) shift?: string;
  @IsOptional() @IsString() operatorName?: string;
  @IsOptional() @IsString() machineName?: string;
  @IsNumber() @Min(0) goodQty: number;
  @IsOptional() @IsNumber() @Min(0) scrapQty?: number;
  // PROD-007: rework kept separate from reject (scrapQty) - pieces
  // produced this interval that need rework, not previously-rejected
  // pieces being reprocessed.
  @IsOptional() @IsNumber() @Min(0) reworkQty?: number;
  // Quantity-based manpower - no Employee IDs, matching PROD-003/004/005.
  @IsOptional() @IsNumber() @Min(0) manpowerQty?: number;
  @IsDateString() periodStart: string;
  @IsDateString() periodEnd: string;
  @IsOptional() @IsNumber() @Min(0) downtimeMinutes?: number;
  @IsOptional() @IsString() downtimeReason?: string;
  @IsOptional() @IsString() remarks?: string;
}
