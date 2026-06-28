import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductionIssueItemDto {
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) requiredQty: number;
  @IsNumber() @Min(0) issuedQty: number;
  @IsOptional() @IsString() batchId?: string;
  @IsNumber() @Min(0) unitCost: number;
}

export class CreateProductionIssueDto {
  @IsString() workOrderId: string;
  @IsString() warehouseId: string;
  @IsOptional() @IsString() @IsIn(['FIFO','FEFO']) issueMethod?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ProductionIssueItemDto) items: ProductionIssueItemDto[];
}
