import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class ReinspectDto {
  @IsNumber() @Min(0) passQty: number;
  @IsNumber() @Min(0) failQty: number;
  @IsOptional() @IsString() notes?: string;
}
