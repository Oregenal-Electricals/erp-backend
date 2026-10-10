import { IsString, IsOptional } from 'class-validator';

export class ResolveOrCreateMappingDto {
  @IsString() customerId: string;
  @IsString() customerItemCode: string;
  @IsOptional() @IsString() customerItemName?: string;
  // Only used when no mapping exists yet - the internal Product or Raw
  // Material to map this customer item code to (a customer PO line can
  // be for either). Exactly one of productId/rawMaterialId is required
  // when actually creating a mapping - enforced in the service, not
  // here, since a pure resolve check must be able to omit both.
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() rawMaterialId?: string;
}

export class RequestMappingChangeDto {
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() rawMaterialId?: string;
  @IsOptional() @IsString() remarks?: string;
}
