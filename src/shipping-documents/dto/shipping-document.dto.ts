import { IsString, IsOptional, IsDateString, IsIn, IsInt, Min } from 'class-validator';

const DOC_TYPES = ['BL', 'AWB', 'SEAWAY_BILL'];
const FREIGHT_TERMS = ['PREPAID', 'COLLECT'];

export class CreateShippingDocumentDto {
  @IsString() shipmentId: string;
  @IsString() ipoId: string;
  @IsString() @IsIn(DOC_TYPES) documentType: string;
  @IsString() documentNumber: string;
  @IsOptional() @IsDateString() issueDate?: string;
  @IsOptional() @IsString() placeOfIssue?: string;
  @IsOptional() @IsString() shipperName?: string;
  @IsOptional() @IsString() consigneeName?: string;
  @IsOptional() @IsString() notifyParty?: string;
  @IsOptional() @IsString() portOfLoading?: string;
  @IsOptional() @IsString() portOfDischarge?: string;
  @IsOptional() @IsString() descriptionOfGoods?: string;
  @IsOptional() @IsString() @IsIn(FREIGHT_TERMS) freightTerms?: string;
  @IsOptional() @IsInt() @Min(0) numberOfOriginals?: number;
  @IsOptional() @IsInt() @Min(0) originalsReceived?: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateShippingDocumentDto {
  @IsOptional() @IsString() shipperName?: string;
  @IsOptional() @IsString() consigneeName?: string;
  @IsOptional() @IsString() notifyParty?: string;
  @IsOptional() @IsString() descriptionOfGoods?: string;
  @IsOptional() @IsInt() @Min(0) numberOfOriginals?: number;
  @IsOptional() @IsInt() @Min(0) originalsReceived?: number;
  @IsOptional() @IsString() notes?: string;
}
