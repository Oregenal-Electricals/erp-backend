import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class IssueItemDto {
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsString() uom: string;
  @IsNumber() @Min(0) requestedQty: number;
}

export class CreateStockIssueDto {
  @IsString() warehouseId: string;
  @IsString() issuedTo: string;
  @IsOptional() @IsString() @IsIn(['PRODUCTION','SALES','INTERNAL']) referenceType?: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() @IsIn(['FIFO','FEFO']) issueMethod?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => IssueItemDto) items: IssueItemDto[];
}
