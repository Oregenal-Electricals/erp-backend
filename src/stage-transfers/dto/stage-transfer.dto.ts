import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class GiveTransferDto {
  @IsString() fromWorkOrderId: string;
  @IsString() toWorkOrderId: string;
  @IsOptional() @IsNumber() @Min(0.0001) qty?: number;
  @IsOptional() @IsString() remarks?: string;
}

// PROD-013: final production stage handover to Production QC - no
// destination WorkOrder, since QC is not another routing stage.
export class GiveToQcDto {
  @IsString() fromWorkOrderId: string;
  @IsOptional() @IsNumber() @Min(0.0001) qty?: number;
  @IsOptional() @IsString() batchLot?: string;
  @IsOptional() @IsString() remarks?: string;
}
