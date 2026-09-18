import { IsString, IsOptional } from 'class-validator';

export class CreateConfirmationDto {
  @IsString() loadingId: string;
}

export class ConfirmPackageDto {
  @IsString() packageId: string;
}

export class ReverseConfirmationDto {
  @IsOptional() @IsString() reason?: string;
}
