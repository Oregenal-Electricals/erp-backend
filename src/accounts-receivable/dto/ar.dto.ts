import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const TERMS = ['IMMEDIATE','NET_30','NET_45','NET_60','NET_90'];
const MODES = ['BANK_TRANSFER','CHEQUE','CASH','UPI','NEFT','RTGS'];

// Task #53: a manually-created AR Invoice can optionally itemize its
// lines the same way createFromDispatch() does automatically. Internal
// item reference is itemCode/itemName (mirroring CustomerPoItem/
// SalesOrderItem/DispatchItem elsewhere) plus an optional productId/
// rawMaterialId soft reference used to resolve the customer's own
// wording via CustomerItemMapping - a missing mapping never blocks
// creation, ArService falls back to itemName.
export class CreateArInvoiceItemDto {
  @IsOptional() @IsString() dispatchItemId?: string;
  @IsOptional() @IsString() soItemId?: string;
  @IsString() itemCode: string;
  @IsString() itemName: string;
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() rawMaterialId?: string;
  @IsNumber() @Min(0) qty: number;
  @IsOptional() @IsString() uom?: string;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsNumber() @Min(0) gstRate?: number;
  @IsNumber() @Min(0) gstAmount: number;
  @IsNumber() @Min(0) totalAmount: number;
}

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
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateArInvoiceItemDto) items?: CreateArInvoiceItemDto[];
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
