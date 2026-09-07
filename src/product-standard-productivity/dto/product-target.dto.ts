import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateProductTargetDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0.0001)
  piecesPerManHour: number;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}

export class ReviseProductTargetDto {
  @IsNumber()
  @Min(0.0001)
  piecesPerManHour: number;

  @IsDateString()
  effectiveFrom: string;
}
