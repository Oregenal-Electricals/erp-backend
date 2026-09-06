import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

// STORE-003 section 20/21/60: the balance delivery must be a new,
// valid Store Receiving line, never a free-typed number that could
// be mistyped or forged - linking to a real storeReceivingItemId
// keeps the later receipt traceable and prevents inventing quantity.
export class LinkBalanceDeliveryDto {
  @IsNumber()
  @Min(0.0001)
  qty: number;

  @IsString()
  laterStoreReceivingItemId: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ApproveShortClosureDto {
  @IsNumber()
  @Min(0.0001)
  qty: number;

  @IsString()
  reason: string;
}
