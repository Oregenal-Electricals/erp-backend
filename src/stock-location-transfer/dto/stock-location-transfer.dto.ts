import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

const TRANSFER_REASONS = [
  'SPACE_OPTIMIZATION', 'BIN_FULL', 'REORGANIZATION', 'MATERIAL_CONSOLIDATION',
  'PICKING_CONVENIENCE', 'SAFETY', 'RACK_MAINTENANCE', 'PHYSICAL_CORRECTION_REQUEST', 'OTHER',
];

export class TransferLocationDto {
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsOptional() @IsString() batchId?: string;
  @IsOptional() @IsIn(['AVAILABLE', 'HOLD', 'REJECTED', 'QC_PENDING']) status?: string;
  @IsString() fromBinId: string;
  @IsString() toBinId: string;
  @IsNumber() @Min(0.0001) qty: number;
  @IsOptional() @IsIn(TRANSFER_REASONS) reason?: string;
  @IsOptional() @IsString() remarks?: string;
}
