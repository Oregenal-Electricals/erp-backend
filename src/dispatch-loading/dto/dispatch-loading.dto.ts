import { IsString, IsOptional } from 'class-validator';

export class StartLoadingDto {
  @IsString() transportAssignmentId: string;
  @IsOptional() @IsString() actualVehicleNumber?: string;
}

export class LoadPackageDto {
  @IsString() packageId: string;
  @IsOptional() @IsString() actualVehicleNumber?: string;
}

export class UnloadPackageDto {
  @IsOptional() @IsString() reason?: string;
}
