import { IsString, IsOptional, IsObject, IsDateString, IsIn } from 'class-validator';

export class CreateProductRevisionDto {
  @IsString() productId: string;
  @IsString() revisionNumber: string;
  @IsString() changeDescription: string;
  @IsOptional() @IsString() @IsIn(['MAJOR', 'MINOR', 'PATCH']) changeType?: string;
  @IsOptional() @IsString() previousRevision?: string;
  @IsOptional() @IsString() drawingNumber?: string;
  @IsOptional() @IsObject() specifications?: Record<string, any>;
  @IsOptional() @IsDateString() effectiveDate?: string;
}

export class UpdateProductRevisionDto {
  @IsOptional() @IsString() changeDescription?: string;
  @IsOptional() @IsString() @IsIn(['MAJOR', 'MINOR', 'PATCH']) changeType?: string;
  @IsOptional() @IsString() drawingNumber?: string;
  @IsOptional() @IsObject() specifications?: Record<string, any>;
  @IsOptional() @IsDateString() effectiveDate?: string;
}
