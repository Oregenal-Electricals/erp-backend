import { IsString, IsOptional } from 'class-validator';

export class ResolveOrCreateMappingDto {
  @IsString() customerId: string;
  @IsString() customerItemCode: string;
  @IsOptional() @IsString() customerItemName?: string;
  // Only used when no mapping exists yet - the internal product to map
  // this customer item code to. Optional on the DTO so a pure resolve
  // check can omit it without failing validation.
  @IsOptional() @IsString() productId?: string;
}

export class RequestMappingChangeDto {
  @IsString() productId: string;
  @IsOptional() @IsString() remarks?: string;
}
