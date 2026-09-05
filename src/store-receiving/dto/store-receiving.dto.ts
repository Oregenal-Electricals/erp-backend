import { IsOptional, IsString, IsUUID } from 'class-validator';

// STORE-001: the only input needed to acknowledge physical arrival is
// which Gate-In it's for, plus an optional receiving area/warehouse
// and remarks. Everything else (supplier, PO, material lines,
// expected qty) is derived server-side from the GateInwardEntry -
// Store does not re-type Gate data, per spec section 5.
export class ReceiveAtStoreDto {
  @IsUUID()
  gateInwardEntryId: string;

  @IsOptional()
  @IsString()
  receivingWarehouseId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
