import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class IqcItemUpdateDto {
  @IsString() id: string;
  @IsNumber() @Min(0) acceptedQty: number;
  @IsNumber() @Min(0) rejectedQty: number;
  @IsOptional() @IsString() rejectionReason?: string;
}

export class CreateIqcDto {
  @IsString() grnId: string;
  @IsOptional() @IsString() inspectedBy?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateIqcItemsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => IqcItemUpdateDto)
  items: IqcItemUpdateDto[];
}
