import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min } from 'class-validator';

const TERMS = ['IMMEDIATE','NET_30','NET_45','NET_60','NET_90'];
const MODES = ['BANK_TRANSFER','CHEQUE','CASH','UPI','NEFT','RTGS'];

export class CreateArInvoiceDto {
  @IsOptional() @IsString() dispatchId?: string;
  @IsOptional() @IsString() soId?: string;
  @IsString() customerName: string;
  @IsOptional() @IsString() customerAddress?: string;
  @IsOptional() @IsDateString() invoiceDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() @IsIn(TERMS) paymentTerms?: string;
  @IsNumber() @Min(0) subtotal: number;
  @IsNumber() @Min(0) totalGst: number;
  @IsNumber() @Min(0) totalAmount: number;
  @IsOptional() @IsString() notes?: string;
}

export class CreateArPaymentDto {
  @IsString() invoiceId: string;
  @IsOptional() @IsDateString() paymentDate?: string;
  @IsNumber() @Min(0) amount: number;
  @IsString() @IsIn(MODES) paymentMode: string;
  @IsOptional() @IsString() referenceNumber?: string;
  @IsOptional() @IsString() bankAccountId?: string;
  @IsOptional() @IsString() remarks?: string;
}
