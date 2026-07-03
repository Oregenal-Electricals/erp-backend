import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

const EVENT_TYPES = ['INVOICE_OVERDUE','DISPATCH_CREATED','PAYMENT_RECEIVED','CREDIT_HOLD','LOW_STOCK','PO_APPROVED','SO_CONFIRMED','DELIVERY_CONFIRMED','NCR_RAISED','CAPA_OVERDUE'];
const CHANNELS = ['EMAIL','SMS','BOTH'];
const RECIPIENTS = ['CUSTOMER','INTERNAL','BOTH'];

export class CreateAlertTemplateDto {
  @IsString() @IsIn(EVENT_TYPES) eventType: string;
  @IsOptional() @IsString() @IsIn(CHANNELS) channel?: string;
  @IsString() subject: string;
  @IsString() bodyTemplate: string;
  @IsOptional() @IsString() @IsIn(RECIPIENTS) recipients?: string;
  @IsOptional() @IsString() recipientEmails?: string;
}

export class UpdateAlertTemplateDto {
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() bodyTemplate?: string;
  @IsOptional() @IsString() @IsIn(RECIPIENTS) recipients?: string;
  @IsOptional() @IsString() recipientEmails?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class TriggerAlertDto {
  @IsString() eventType: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() referenceNumber?: string;
  @IsOptional() variables?: Record<string, string>;
}
