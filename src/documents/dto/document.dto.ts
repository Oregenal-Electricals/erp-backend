import { IsString, IsOptional, IsInt, IsIn, Min, Max } from 'class-validator';

const CATEGORIES = ['PURCHASE','QUALITY','SALES','FINANCE','HR','PRODUCTION','GENERAL'];
const FILE_TYPES = ['PDF','IMAGE','EXCEL','WORD','OTHER'];

export class CreateDocumentDto {
  @IsString() title: string;
  @IsOptional() @IsString() @IsIn(CATEGORIES) category?: string;
  @IsOptional() @IsString() @IsIn(FILE_TYPES) fileType?: string;
  @IsString() fileName: string;
  @IsInt() @Min(1) @Max(10485760) fileSize: number; // max 10MB
  @IsString() fileData: string; // base64
  @IsString() mimeType: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() referenceNumber?: string;
  @IsOptional() @IsString() tags?: string;
  @IsOptional() @IsString() description?: string;
}

export class NewVersionDto extends CreateDocumentDto {
  @IsString() parentDocId: string;
}
