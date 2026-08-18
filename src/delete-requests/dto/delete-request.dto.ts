import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateDeleteRequestDto {
  @IsString() @IsNotEmpty() tableName: string;
  @IsString() @IsNotEmpty() recordId: string;
  @IsString() @MinLength(5, { message: 'Give a real reason (at least 5 characters) - this is what the approver sees' })
  reason: string;
}

export class RejectDeleteRequestDto {
  @IsString() comments?: string;
}
