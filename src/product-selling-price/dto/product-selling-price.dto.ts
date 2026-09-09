import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateSellingPriceDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0.0001)
  sellingPrice: number;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}

export class ReviseSellingPriceDto {
  @IsNumber()
  @Min(0.0001)
  sellingPrice: number;

  @IsDateString()
  effectiveFrom: string;
}
