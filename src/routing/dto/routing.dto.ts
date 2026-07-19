import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RoutingStageDto {
  @IsString() stageName: string;
  @IsString() bomId: string;
  @IsOptional() @IsString() warehouseId?: string;
}

export class CreateRoutingDto {
  @IsString() finalProductId: string;
  @IsString() routingName: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutingStageDto)
  stages: RoutingStageDto[];
}

export class StartProductionDto {
  @IsString() routingId: string;
  @IsNumber() @Min(0.0001) plannedQty: number;
  @IsString() warehouseId: string;
}
