import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePackingDto {
  @IsString() verificationId: string;
}

export class CreatePackageDto {
  @IsOptional() @IsString() packageType?: string;
  @IsOptional() @IsNumber() netWeight?: number;
  @IsOptional() @IsNumber() grossWeight?: number;
}

export class AddPackageItemDto {
  @IsString() verificationItemId: string;
  @IsNumber() @Min(0.0001) packedQty: number;
}

export class ReversePackageItemDto {
  @IsNumber() @Min(0.0001) reverseQty: number;
  @IsOptional() @IsString() reason?: string;
}
