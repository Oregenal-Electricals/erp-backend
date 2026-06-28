import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min } from 'class-validator';

const STATUSES = ['DRAFT','RELEASED','IN_PROGRESS','COMPLETED','CANCELLED'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'];

export class CreateWorkOrderDto {
  @IsString() productCode: string;
  @IsString() productName: string;
  @IsOptional() @IsString() uom?: string;
  @IsOptional() @IsString() bomId?: string;
  @IsString() warehouseId: string;
  @IsNumber() @Min(0) plannedQty: number;
  @IsDateString() plannedStartDate: string;
  @IsDateString() plannedEndDate: string;
  @IsOptional() @IsString() @IsIn(PRIORITIES) priority?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateWorkOrderDto {
  @IsOptional() @IsString() @IsIn(STATUSES) status?: string;
  @IsOptional() @IsNumber() @Min(0) completedQty?: number;
  @IsOptional() @IsNumber() @Min(0) rejectedQty?: number;
  @IsOptional() @IsDateString() actualStartDate?: string;
  @IsOptional() @IsDateString() actualEndDate?: string;
  @IsOptional() @IsString() @IsIn(PRIORITIES) priority?: string;
  @IsOptional() @IsString() remarks?: string;
}
