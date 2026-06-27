import { IsString, IsOptional, IsNumber, IsDateString, IsIn, IsInt, Min } from 'class-validator';

const MODES = ['SEA', 'AIR', 'ROAD', 'COURIER'];
const CONTAINER_TYPES = ['20GP', '40GP', '40HC', '20RF', '40RF'];

export class CreateShipmentDto {
  @IsString() ipoId: string;
  @IsOptional() @IsString() paymentInstrumentId?: string;
  @IsString() @IsIn(MODES) shipmentMode: string;
  @IsString() carrierName: string;
  @IsOptional() @IsString() vesselName?: string;
  @IsOptional() @IsString() voyageNumber?: string;
  @IsOptional() @IsString() flightNumber?: string;
  @IsOptional() @IsString() blNumber?: string;
  @IsOptional() @IsString() awbNumber?: string;
  @IsOptional() @IsString() portOfLoading?: string;
  @IsOptional() @IsString() portOfDischarge?: string;
  @IsOptional() @IsDateString() etd?: string;
  @IsOptional() @IsDateString() eta?: string;
  @IsOptional() @IsInt() @Min(0) totalPackages?: number;
  @IsOptional() @IsNumber() @Min(0) totalWeight?: number;
  @IsOptional() @IsNumber() @Min(0) totalVolume?: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateShipmentDto {
  @IsOptional() @IsString() carrierName?: string;
  @IsOptional() @IsString() vesselName?: string;
  @IsOptional() @IsString() voyageNumber?: string;
  @IsOptional() @IsString() blNumber?: string;
  @IsOptional() @IsString() awbNumber?: string;
  @IsOptional() @IsDateString() etd?: string;
  @IsOptional() @IsDateString() eta?: string;
  @IsOptional() @IsDateString() atd?: string;
  @IsOptional() @IsDateString() ata?: string;
  @IsOptional() @IsInt() @Min(0) totalPackages?: number;
  @IsOptional() @IsNumber() @Min(0) totalWeight?: number;
  @IsOptional() @IsNumber() @Min(0) totalVolume?: number;
  @IsOptional() @IsString() notes?: string;
}

export class AddContainerDto {
  @IsString() containerNumber: string;
  @IsOptional() @IsString() @IsIn(CONTAINER_TYPES) containerType?: string;
  @IsOptional() @IsString() sealNumber?: string;
}
