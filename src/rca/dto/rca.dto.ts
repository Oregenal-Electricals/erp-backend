import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateRcaDto {
  @IsString() ncrId: string;
  @IsString() @IsIn(['FIVE_WHY','FISHBONE','BOTH']) method: string;
  @IsString() problem: string;
  @IsOptional() @IsString() why1?: string;
  @IsOptional() @IsString() why2?: string;
  @IsOptional() @IsString() why3?: string;
  @IsOptional() @IsString() why4?: string;
  @IsOptional() @IsString() why5?: string;
  @IsOptional() @IsString() rootCause?: string;
  @IsOptional() @IsString() fishboneMan?: string;
  @IsOptional() @IsString() fishboneMachine?: string;
  @IsOptional() @IsString() fishboneMaterial?: string;
  @IsOptional() @IsString() fishboneMethod?: string;
  @IsOptional() @IsString() fishboneEnvironment?: string;
  @IsOptional() @IsString() fishboneMeasurement?: string;
  @IsOptional() @IsString() conclusion?: string;
  @IsOptional() @IsString() conductedBy?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateRcaDto {
  @IsOptional() @IsString() why1?: string;
  @IsOptional() @IsString() why2?: string;
  @IsOptional() @IsString() why3?: string;
  @IsOptional() @IsString() why4?: string;
  @IsOptional() @IsString() why5?: string;
  @IsOptional() @IsString() rootCause?: string;
  @IsOptional() @IsString() fishboneMan?: string;
  @IsOptional() @IsString() fishboneMachine?: string;
  @IsOptional() @IsString() fishboneMaterial?: string;
  @IsOptional() @IsString() fishboneMethod?: string;
  @IsOptional() @IsString() fishboneEnvironment?: string;
  @IsOptional() @IsString() fishboneMeasurement?: string;
  @IsOptional() @IsString() conclusion?: string;
  @IsOptional() @IsString() conductedBy?: string;
  @IsOptional() @IsString() remarks?: string;
}
