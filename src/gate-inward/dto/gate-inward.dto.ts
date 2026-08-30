import {
  IsString, IsOptional, IsEnum,
  IsNumber, IsInt, IsUUID, Min,
  IsDateString, MinLength, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class GateInwardItemDto {
  @ApiPropertyOptional({ example: 'uuid-of-po-item' })
  @IsOptional()
  @IsString()
  poItemId?: string;
  @ApiProperty({ example: 'WIR-001' })
  @IsString()
  itemCode: string;
  @ApiProperty({ example: 'Copper Wire 1.5 sqmm' })
  @IsString()
  itemName: string;
  @ApiPropertyOptional({ example: 'NOS' })
  @IsOptional()
  @IsString()
  uom?: string;
  @ApiProperty({ example: 50 })
  @IsNumber()
  quantity: number;
  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  packageCount?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
export class CreateGateInwardDto {
  @ApiProperty({ example: 'uuid-of-plant' })
  @IsUUID('4')
  plantId: string;
  @ApiPropertyOptional({ example: 'uuid-of-vehicle-log' })
  @IsOptional()
  @IsUUID('4')
  vehicleLogId?: string;
  @ApiPropertyOptional({ example: 'MH12AB1234' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;
  @ApiPropertyOptional({ example: 'Ramesh Kumar' })
  @IsOptional()
  @IsString()
  driverName?: string;
  @ApiProperty({ example: 'ABC Steel Suppliers' })
  @IsString()
  @MinLength(2)
  supplierName: string;
  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  supplierMobile?: string;
  @ApiPropertyOptional({ example: '27AABCA1234Z1ZX' })
  @IsOptional()
  @IsString()
  supplierGstin?: string;
  @ApiPropertyOptional({ example: 'uuid-of-purchase-order' })
  @IsOptional()
  @IsUUID('4')
  poId?: string;
  @ApiPropertyOptional({ example: 'PO-26-27-0001' })
  @IsOptional()
  @IsString()
  poNumber?: string;
  @ApiPropertyOptional({ example: 'INV-2024-001' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;
  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;
  @ApiPropertyOptional({ example: 125000.00 })
  @IsOptional()
  @IsNumber()
  invoiceAmount?: number;
  @ApiPropertyOptional({ example: 'MS Steel Rods 10mm - 50 bundles' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  materialDescription?: string;
  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  quantity?: number;
  @ApiPropertyOptional({ example: 'NOS' })
  @IsOptional()
  @IsString()
  unit?: string;
  @ApiPropertyOptional({ type: [GateInwardItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GateInwardItemDto)
  items?: GateInwardItemDto[];
  @ApiPropertyOptional({ example: 2500.5 })
  @IsOptional()
  @IsNumber()
  grossWeight?: number;
  @ApiPropertyOptional({ example: 2450.0 })
  @IsOptional()
  @IsNumber()
  netWeight?: number;
  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  packageCount?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
export class UpdateGateInwardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poNumber?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceNumber?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialDescription?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
export class VerifyGateInwardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
export class RejectGateInwardDto {
  @ApiProperty({ example: 'Material does not match PO description' })
  @IsString()
  @MinLength(5)
  rejectionReason: string;
}

export class GateInDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ResolveHoldWithPoDto {
  @ApiProperty({ example: 'uuid-of-purchase-order' })
  @IsString()
  poId: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ResolveHoldAsNonPoDto {
  @ApiProperty({ example: 'Sample material approved without PO by Purchase Head' })
  @IsString()
  @MinLength(5)
  remarks: string;
}

export class ResolveHoldAsRejectedDto {
  @ApiProperty({ example: 'No matching PO found, vendor could not confirm order' })
  @IsString()
  @MinLength(5)
  rejectionReason: string;
}

export class ReturnMaterialDto {
  @ApiProperty({ example: 'PO was cancelled by Purchase before delivery, vendor sent it anyway' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class ApprovedExceptionDto {
  @ApiProperty({ example: 'PO shows CLOSED but Purchase confirms this final partial shipment was expected - approved to receive' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class CorrectPoReferenceDto {
  @ApiProperty({ example: 'uuid-of-purchase-order' })
  @IsString()
  poId: string;
  @ApiProperty({ example: 'Security misread the challan - correct PO number is PO-25-26-0088, not 0008' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class FlagMismatchDto {
  @ApiProperty({ enum: ['VENDOR', 'MATERIAL', 'VEHICLE_NUMBER', 'CHALLAN'], example: 'MATERIAL' })
  @IsString()
  mismatchType: 'VENDOR' | 'MATERIAL' | 'VEHICLE_NUMBER' | 'CHALLAN';
  @ApiProperty({ example: 'MS Angle 25x25, PO item IT-001' })
  @IsString()
  @MinLength(2)
  expectedValue: string;
  @ApiProperty({ example: 'MS Angle 40x40, no matching PO item' })
  @IsString()
  @MinLength(2)
  actualValue: string;
  @ApiProperty({ example: 'Opened the truck and the angle size clearly does not match the challan' })
  @IsString()
  @MinLength(5)
  remarks: string;
}

export class ResolveMismatchCorrectReferenceDto {
  @ApiProperty({ example: 'ABC Steel Pvt Ltd' })
  @IsString()
  @MinLength(2)
  correctedValue: string;
  @ApiProperty({ example: 'Security misread the company name on the challan' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class ResolveMismatchApprovedExceptionDto {
  @ApiProperty({ example: 'Vendor confirmed this is a subsidiary delivering on their behalf - approved' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class ResolveMismatchRejectedDto {
  @ApiProperty({ example: 'Wrong material entirely, sent back with the driver' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class FlagDamageDto {
  @ApiProperty({ enum: ['MATERIAL', 'PACKAGING'], example: 'PACKAGING' })
  @IsString()
  damageType: 'MATERIAL' | 'PACKAGING';
  @ApiProperty({ example: 'Outer cartons crushed on one side, visible tears in 3 boxes' })
  @IsString()
  @MinLength(5)
  description: string;
  @ApiPropertyOptional({ example: 'Boxes 4, 5, and 7 of 12' })
  @IsOptional()
  @IsString()
  affectedPackages?: string;
  @ApiProperty({ enum: ['REJECT', 'ACCEPT_EXCEPTION'], example: 'ACCEPT_EXCEPTION' })
  @IsString()
  gateRecommendation: 'REJECT' | 'ACCEPT_EXCEPTION';
}

export class ResolveDamageRejectDto {
  @ApiProperty({ example: 'Confirmed with Purchase - visible damage too severe, vendor to arrange replacement' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class ResolveDamageAcceptExceptionDto {
  @ApiProperty({ example: 'Only outer packaging affected, material likely intact - Store/QC to inspect thoroughly on receipt' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class RecordReturnGateOutDto {
  @ApiProperty({ example: 'Loaded back onto the same vehicle, driver signed the return note' })
  @IsString()
  @MinLength(5)
  remarks: string;
}

export class VerifyPackageCountDto {
  @ApiProperty({ example: 48 })
  @IsInt()
  @Min(0)
  actualPackageCount: number;
}

export class ResolvePackageCountRecountDto {
  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(0)
  newActualCount: number;
  @ApiProperty({ example: 'Recounted with the driver present, first count missed 2 boxes stacked behind others' })
  @IsString()
  @MinLength(5)
  remarks: string;
}

export class ResolvePackageCountEscalateDto {
  @ApiProperty({ example: 'Asked Store to cross-check against the last 3 deliveries from this vendor' })
  @IsString()
  @MinLength(5)
  remarks: string;
}

export class ResolvePackageCountApprovedInwardDto {
  @ApiProperty({ example: 'Vendor confirmed partial shipment, remaining packages to follow separately - accepted' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class ResolvePackageCountRejectedDto {
  @ApiProperty({ example: 'Discrepancy too large to accept, sent back for vendor to reconcile' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class FlagDocumentMissingDto {
  @ApiProperty({ enum: ['CHALLAN', 'INVOICE', 'BOTH'], example: 'CHALLAN' })
  @IsString()
  documentType: 'CHALLAN' | 'INVOICE' | 'BOTH';
  @ApiProperty({ example: 'Driver says the challan was left at the vendor office, will send by email' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class ResolveDocumentMissingExceptionDto {
  @ApiProperty({ example: 'Vendor confirmed by phone, document to follow by email within the day - accepted' })
  @IsString()
  @MinLength(5)
  reason: string;
}

export class ResolveDocumentMissingRejectDto {
  @ApiProperty({ example: 'No confirmation from vendor, cannot accept without documentation' })
  @IsString()
  @MinLength(5)
  reason: string;
}
