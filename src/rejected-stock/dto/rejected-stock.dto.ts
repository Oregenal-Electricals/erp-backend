import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';

const DISPOSITIONS = ['RTV', 'SCRAPPED', 'REWORK', 'ACCEPTED'];

export class DisposeItemDto {
  @IsString() @IsIn(DISPOSITIONS) disposition: string;
  @IsOptional() @IsString() dispositionNotes?: string;
  @IsOptional() @IsString() dispositionBy?: string;
}

export class CreateFromFgReceiptDto {
  @IsString() @MinLength(3, { message: 'Give a real reason (at least 3 characters) for the rejection' })
  reason: string;
}
