import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PutawayItemDto {
  @IsString() binId: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) qty: number;
  @IsNumber() @Min(0) unitCost: number;
}

export class CreatePutawayDto {
  @IsString() grnId: string;
  @IsOptional() @IsString() iqcId?: string;
  @IsString() warehouseId: string;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PutawayItemDto) items?: PutawayItemDto[];
}

export class UpdatePutawayItemsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => PutawayItemDto) items: PutawayItemDto[];
}
