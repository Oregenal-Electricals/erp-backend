"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolveDocumentMissingRejectDto = exports.ResolveDocumentMissingExceptionDto = exports.FlagDocumentMissingDto = exports.ResolvePackageCountRejectedDto = exports.ResolvePackageCountApprovedInwardDto = exports.ResolvePackageCountEscalateDto = exports.ResolvePackageCountRecountDto = exports.VerifyPackageCountDto = exports.RecordReturnGateOutDto = exports.ResolveDamageAcceptExceptionDto = exports.ResolveDamageRejectDto = exports.FlagDamageDto = exports.ResolveMismatchRejectedDto = exports.ResolveMismatchApprovedExceptionDto = exports.ResolveMismatchCorrectReferenceDto = exports.FlagMismatchDto = exports.CorrectPoReferenceDto = exports.ApprovedExceptionDto = exports.ReturnMaterialDto = exports.ResolveHoldAsRejectedDto = exports.ResolveHoldAsNonPoDto = exports.ResolveHoldWithPoDto = exports.GateInDto = exports.RejectGateInwardDto = exports.VerifyGateInwardDto = exports.UpdateGateInwardDto = exports.CreateGateInwardDto = exports.GateInwardItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class GateInwardItemDto {
}
exports.GateInwardItemDto = GateInwardItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-of-po-item' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GateInwardItemDto.prototype, "poItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'WIR-001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GateInwardItemDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Copper Wire 1.5 sqmm' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GateInwardItemDto.prototype, "itemName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'NOS' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GateInwardItemDto.prototype, "uom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GateInwardItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], GateInwardItemDto.prototype, "packageCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GateInwardItemDto.prototype, "remarks", void 0);
class CreateGateInwardDto {
}
exports.CreateGateInwardDto = CreateGateInwardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-plant' }),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "plantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-of-vehicle-log' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "vehicleLogId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'MH12AB1234' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ramesh Kumar' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "driverName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ABC Steel Suppliers' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "supplierName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '9876543210' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "supplierMobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '27AABCA1234Z1ZX' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "supplierGstin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-of-purchase-order' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "poId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'PO-26-27-0001' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "poNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'INV-2024-001' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "invoiceNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-06-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "invoiceDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 125000.00 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateGateInwardDto.prototype, "invoiceAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'MS Steel Rods 10mm - 50 bundles' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "materialDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateGateInwardDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'NOS' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [GateInwardItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => GateInwardItemDto),
    __metadata("design:type", Array)
], CreateGateInwardDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2500.5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateGateInwardDto.prototype, "grossWeight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2450.0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateGateInwardDto.prototype, "netWeight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateGateInwardDto.prototype, "packageCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateInwardDto.prototype, "remarks", void 0);
class UpdateGateInwardDto {
}
exports.UpdateGateInwardDto = UpdateGateInwardDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGateInwardDto.prototype, "supplierName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGateInwardDto.prototype, "poNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGateInwardDto.prototype, "invoiceNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateGateInwardDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGateInwardDto.prototype, "materialDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGateInwardDto.prototype, "remarks", void 0);
class VerifyGateInwardDto {
}
exports.VerifyGateInwardDto = VerifyGateInwardDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyGateInwardDto.prototype, "remarks", void 0);
class RejectGateInwardDto {
}
exports.RejectGateInwardDto = RejectGateInwardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Material does not match PO description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], RejectGateInwardDto.prototype, "rejectionReason", void 0);
class GateInDto {
}
exports.GateInDto = GateInDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GateInDto.prototype, "remarks", void 0);
class ResolveHoldWithPoDto {
}
exports.ResolveHoldWithPoDto = ResolveHoldWithPoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-purchase-order' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveHoldWithPoDto.prototype, "poId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveHoldWithPoDto.prototype, "remarks", void 0);
class ResolveHoldAsNonPoDto {
}
exports.ResolveHoldAsNonPoDto = ResolveHoldAsNonPoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sample material approved without PO by Purchase Head' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolveHoldAsNonPoDto.prototype, "remarks", void 0);
class ResolveHoldAsRejectedDto {
}
exports.ResolveHoldAsRejectedDto = ResolveHoldAsRejectedDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'No matching PO found, vendor could not confirm order' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolveHoldAsRejectedDto.prototype, "rejectionReason", void 0);
class ReturnMaterialDto {
}
exports.ReturnMaterialDto = ReturnMaterialDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PO was cancelled by Purchase before delivery, vendor sent it anyway' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ReturnMaterialDto.prototype, "reason", void 0);
class ApprovedExceptionDto {
}
exports.ApprovedExceptionDto = ApprovedExceptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PO shows CLOSED but Purchase confirms this final partial shipment was expected - approved to receive' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ApprovedExceptionDto.prototype, "reason", void 0);
class CorrectPoReferenceDto {
}
exports.CorrectPoReferenceDto = CorrectPoReferenceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-purchase-order' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CorrectPoReferenceDto.prototype, "poId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Security misread the challan - correct PO number is PO-25-26-0088, not 0008' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CorrectPoReferenceDto.prototype, "reason", void 0);
class FlagMismatchDto {
}
exports.FlagMismatchDto = FlagMismatchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['VENDOR', 'MATERIAL', 'VEHICLE_NUMBER', 'CHALLAN', 'QUANTITY_EXCESS', 'MIXED_MATERIALS'], example: 'MATERIAL' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FlagMismatchDto.prototype, "mismatchType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MS Angle 25x25, PO item IT-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], FlagMismatchDto.prototype, "expectedValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MS Angle 40x40, no matching PO item' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], FlagMismatchDto.prototype, "actualValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Opened the truck and the angle size clearly does not match the challan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], FlagMismatchDto.prototype, "remarks", void 0);
class ResolveMismatchCorrectReferenceDto {
}
exports.ResolveMismatchCorrectReferenceDto = ResolveMismatchCorrectReferenceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ABC Steel Pvt Ltd' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], ResolveMismatchCorrectReferenceDto.prototype, "correctedValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Security misread the company name on the challan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolveMismatchCorrectReferenceDto.prototype, "reason", void 0);
class ResolveMismatchApprovedExceptionDto {
}
exports.ResolveMismatchApprovedExceptionDto = ResolveMismatchApprovedExceptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Vendor confirmed this is a subsidiary delivering on their behalf - approved' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolveMismatchApprovedExceptionDto.prototype, "reason", void 0);
class ResolveMismatchRejectedDto {
}
exports.ResolveMismatchRejectedDto = ResolveMismatchRejectedDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Wrong material entirely, sent back with the driver' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolveMismatchRejectedDto.prototype, "reason", void 0);
class FlagDamageDto {
}
exports.FlagDamageDto = FlagDamageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['MATERIAL', 'PACKAGING'], example: 'PACKAGING' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FlagDamageDto.prototype, "damageType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Outer cartons crushed on one side, visible tears in 3 boxes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], FlagDamageDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Boxes 4, 5, and 7 of 12' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FlagDamageDto.prototype, "affectedPackages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['REJECT', 'ACCEPT_EXCEPTION'], example: 'ACCEPT_EXCEPTION' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FlagDamageDto.prototype, "gateRecommendation", void 0);
class ResolveDamageRejectDto {
}
exports.ResolveDamageRejectDto = ResolveDamageRejectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Confirmed with Purchase - visible damage too severe, vendor to arrange replacement' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolveDamageRejectDto.prototype, "reason", void 0);
class ResolveDamageAcceptExceptionDto {
}
exports.ResolveDamageAcceptExceptionDto = ResolveDamageAcceptExceptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Only outer packaging affected, material likely intact - Store/QC to inspect thoroughly on receipt' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolveDamageAcceptExceptionDto.prototype, "reason", void 0);
class RecordReturnGateOutDto {
}
exports.RecordReturnGateOutDto = RecordReturnGateOutDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Loaded back onto the same vehicle, driver signed the return note' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], RecordReturnGateOutDto.prototype, "remarks", void 0);
class VerifyPackageCountDto {
}
exports.VerifyPackageCountDto = VerifyPackageCountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 48 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], VerifyPackageCountDto.prototype, "actualPackageCount", void 0);
class ResolvePackageCountRecountDto {
}
exports.ResolvePackageCountRecountDto = ResolvePackageCountRecountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ResolvePackageCountRecountDto.prototype, "newActualCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Recounted with the driver present, first count missed 2 boxes stacked behind others' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolvePackageCountRecountDto.prototype, "remarks", void 0);
class ResolvePackageCountEscalateDto {
}
exports.ResolvePackageCountEscalateDto = ResolvePackageCountEscalateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Asked Store to cross-check against the last 3 deliveries from this vendor' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolvePackageCountEscalateDto.prototype, "remarks", void 0);
class ResolvePackageCountApprovedInwardDto {
}
exports.ResolvePackageCountApprovedInwardDto = ResolvePackageCountApprovedInwardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Vendor confirmed partial shipment, remaining packages to follow separately - accepted' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolvePackageCountApprovedInwardDto.prototype, "reason", void 0);
class ResolvePackageCountRejectedDto {
}
exports.ResolvePackageCountRejectedDto = ResolvePackageCountRejectedDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Discrepancy too large to accept, sent back for vendor to reconcile' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolvePackageCountRejectedDto.prototype, "reason", void 0);
class FlagDocumentMissingDto {
}
exports.FlagDocumentMissingDto = FlagDocumentMissingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['CHALLAN', 'INVOICE', 'BOTH'], example: 'CHALLAN' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FlagDocumentMissingDto.prototype, "documentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Driver says the challan was left at the vendor office, will send by email' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], FlagDocumentMissingDto.prototype, "reason", void 0);
class ResolveDocumentMissingExceptionDto {
}
exports.ResolveDocumentMissingExceptionDto = ResolveDocumentMissingExceptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Vendor confirmed by phone, document to follow by email within the day - accepted' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolveDocumentMissingExceptionDto.prototype, "reason", void 0);
class ResolveDocumentMissingRejectDto {
}
exports.ResolveDocumentMissingRejectDto = ResolveDocumentMissingRejectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'No confirmation from vendor, cannot accept without documentation' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ResolveDocumentMissingRejectDto.prototype, "reason", void 0);
//# sourceMappingURL=gate-inward.dto.js.map