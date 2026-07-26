import { IsString, IsOptional, IsInt, Min, IsDateString, IsIn } from 'class-validator';

const LEVELS = ['HR_TO_PLANT', 'PLANT_TO_STAGE', 'STAGE_TO_LINE'];

export class CreateManpowerAllocationDto {
  @IsDateString() date: string;
  @IsIn(LEVELS) level: string;
  @IsOptional() @IsString() category?: string;
  @IsString() toUserId: string;
  @IsOptional() @IsString() parentId?: string;
  @IsInt() @Min(1) count: number;
  @IsOptional() @IsString() remarks?: string;
}

export class DistributeManpowerDto {
  @IsString() parentId: string;
  lines: {
    toUserId?: string;
    workOrderId?: string;
    category?: string;
    count: number;
    remarks?: string;
  }[];
}

export class RaiseManpowerQueryDto {
  @IsString() allocationId: string;
  @IsString() message: string;
}

export class ResolveManpowerQueryDto {
  @IsString() response: string;
}
