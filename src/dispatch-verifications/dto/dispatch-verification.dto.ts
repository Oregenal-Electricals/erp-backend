import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateVerificationDto {
  @IsString() pickListId: string;
}

export class VerifyItemDto {
  @IsString() pickListItemId: string;
  @IsNumber() @Min(0.0001) verifiedQty: number;
}

export class ReverseVerificationDto {
  @IsNumber() @Min(0.0001) reverseQty: number;
  @IsOptional() @IsString() reason?: string;
}
