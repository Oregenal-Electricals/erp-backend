import { IsString, IsOptional, IsNumber, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateZoneDto {
  @IsString() warehouseId: string;
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateRackDto {
  @IsString() warehouseId: string;
  @IsOptional() @IsString() zoneId?: string;
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsInt() @Min(0) totalBins?: number;
  @IsOptional() @IsString() description?: string;
}

export class CreateBinDto {
  @IsString() warehouseId: string;
  @IsString() rackId: string;
  @IsString() code: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() @Min(0) maxQty?: number;
  @IsOptional() @IsNumber() @Min(0) maxWeight?: number;
}

export class BulkCreateBinsDto {
  @IsString() warehouseId: string;
  @IsString() rackId: string;
  @IsInt() @Min(1) count: number;
  @IsString() prefix: string;
  @IsOptional() @IsNumber() @Min(0) maxQty?: number;
}

export class UpdateBinStatusDto {
  @IsString() status: string;
  @IsOptional() @IsString() itemCode?: string;
  @IsOptional() @IsNumber() @Min(0) currentQty?: number;
}

// STORE task #56 — racks are physically vertical (bay/column x shelf level),
// so bins must be generated vertical-first: all levels within bay 1 before
// moving to bay 2, etc. (not all bays at level 1 before moving to level 2).
export class GenerateRackLocationsDto {
  @IsString() warehouseId: string;
  @IsString() rackId: string;
  @IsInt() @Min(1) bays: number;
  @IsInt() @Min(1) levels: number;
  @IsOptional() @IsString() codePrefix?: string;
  @IsOptional() @IsNumber() @Min(0) maxQty?: number;
  @IsOptional() @IsNumber() @Min(0) maxWeight?: number;
}
