import { IsString, IsOptional, IsIn } from 'class-validator';

const DISPOSITIONS = ['RTV', 'SCRAPPED', 'REWORK', 'ACCEPTED'];

export class DisposeItemDto {
  @IsString() @IsIn(DISPOSITIONS) disposition: string;
  @IsOptional() @IsString() dispositionNotes?: string;
  @IsOptional() @IsString() dispositionBy?: string;
}
