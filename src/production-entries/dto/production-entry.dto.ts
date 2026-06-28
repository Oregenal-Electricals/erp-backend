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
  @IsOptional() @IsString() remarks?: string;
}
