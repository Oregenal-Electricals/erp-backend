import { IsString, IsOptional, IsIn } from 'class-validator';

const AMENDMENT_TYPES = ['QUANTITY_CHANGE', 'DATE_CHANGE', 'ITEM_ADDITION', 'ITEM_CANCELLATION', 'PRICE_CORRECTION', 'GENERAL'];

export class CreatePoAmendmentDto {
  @IsString() poId: string;
  @IsOptional() @IsString() @IsIn(AMENDMENT_TYPES) amendmentType?: string;
  @IsString() reason: string;
  @IsOptional() changes?: any;
}

export class RejectAmendmentDto {
  @IsString() rejectionReason: string;
}
