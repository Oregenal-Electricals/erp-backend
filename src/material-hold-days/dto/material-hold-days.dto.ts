import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

// A rule's identity (rawMaterialId + vendorId) is fixed at creation -
// to re-scope a rule to a different material/vendor, delete it and
// create a new one. This mirrors UpdateRawMaterialDto, which likewise
// never lets `code` change after create.
export class CreateMaterialHoldDaysRuleDto {
  @IsUUID('4')
  rawMaterialId: string;

  // Omit entirely (or send null) for this material's own default,
  // applied whenever no vendor-specific rule exists for a given batch.
  @IsOptional()
  @IsUUID('4')
  vendorId?: string;

  @IsInt()
  @Min(1)
  @Max(3650)
  holdDays: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateMaterialHoldDaysRuleDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  holdDays?: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDefaultHoldDaysDto {
  @IsInt()
  @Min(1)
  @Max(3650)
  holdDays: number;
}
