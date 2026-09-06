import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

// STORE-002: no UOM-conversion architecture exists yet, so batches
// are captured as-entered (batchNumber/lotNumber/dates/quantity) with
// no unit conversion attempted here.
export class VerifyLineBatchDto {
  @IsString()
  batchNumber: string;

  @IsOptional()
  @IsString()
  lotNumber?: string;

  @IsOptional()
  mfgDate?: string;

  @IsOptional()
  expiryDate?: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}

export class VerifyLineDto {
  @IsNumber()
  @Min(0)
  actualQty: number;

  @IsString()
  actualUom: string;

  // Store's own judgment call that the physical material isn't what
  // was expected (spec section 6) - never an automatic spec
  // comparison, since detailed technical QC is explicitly out of
  // scope for this module.
  @IsOptional()
  @IsBoolean()
  materialMismatch?: boolean;

  @IsOptional()
  @IsString()
  mismatchDescription?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  damagedQty?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerifyLineBatchDto)
  batches?: VerifyLineBatchDto[];

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CorrectLineDto {
  @IsNumber()
  @Min(0)
  actualQty: number;

  @IsString()
  reason: string;
}
