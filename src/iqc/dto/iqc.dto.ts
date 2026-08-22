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

export class AttachTemplateDto {
  @IsString() templateId: string;
  @IsOptional() @IsNumber() @Min(0) sampleSize?: number;
}

export class IqcCheckParameterDto {
  @IsOptional() @IsString() id?: string;
  @IsNumber() sNo: number;
  @IsString() category: string;
  @IsString() parameterName: string;
  @IsString() specification: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class CreateIqcCheckTemplateDto {
  @IsOptional() @IsString() rawMaterialId?: string;
  @IsString() name: string;
  @IsOptional() @IsString() docCode?: string;
  @IsOptional() @IsString() revision?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => IqcCheckParameterDto)
  parameters: IqcCheckParameterDto[];
}

export class UpdateIqcCheckTemplateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() docCode?: string;
  @IsOptional() @IsString() revision?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => IqcCheckParameterDto)
  parameters?: IqcCheckParameterDto[];
}

export class IqcParameterResultDto {
  @IsString() parameterId: string;
  @IsOptional() @IsString() s1?: string;
  @IsOptional() @IsString() s2?: string;
  @IsOptional() @IsString() s3?: string;
  @IsOptional() @IsString() s4?: string;
  @IsOptional() @IsString() s5?: string;
  @IsOptional() @IsString() remark?: string;
}

export class SubmitIqcStageResultDto {
  @IsString() outcome: string;
  @IsString() remarks: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => IqcParameterResultDto)
  parameterResults?: IqcParameterResultDto[];
}
