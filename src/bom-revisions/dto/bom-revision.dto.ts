import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateBomRevisionDto {
  @IsString() productId: string;
  @IsString() bomId: string;
  @IsOptional() @IsString() previousBomId?: string;
  @IsString() revisionNumber: string;
  @IsOptional() @IsString() @IsIn(['MAJOR', 'MINOR', 'PATCH']) changeType?: string;
  @IsString() changeDescription: string;
  @IsOptional() @IsString() ecnNumber?: string;
  @IsOptional() @IsDateString() effectiveDate?: string;
}
