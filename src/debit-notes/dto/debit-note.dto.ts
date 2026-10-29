import { IsString, IsIn, IsOptional } from 'class-validator';

const DEBIT_NOTE_STATUSES = ['DRAFT', 'ISSUED', 'SETTLED', 'CANCELLED'];

export class UpdateDebitNoteStatusDto {
  @IsString() @IsIn(DEBIT_NOTE_STATUSES) status: string;
  @IsOptional() @IsString() remarks?: string;
}
