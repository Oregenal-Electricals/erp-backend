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
exports.SegregateDiscrepancyDto = exports.DIRECT_RESOLUTIONS = exports.AUTHORIZATION_RESOLUTIONS = exports.DirectResolveDto = exports.DecideResolutionDto = exports.RequestResolutionDto = exports.QcReviewDto = exports.PurchaseReviewDto = exports.CorrectDiscrepancyDto = exports.RaiseDiscrepancyDto = void 0;
const class_validator_1 = require("class-validator");
const PROBLEM_TYPES = ['WRONG_MATERIAL', 'SPECIFICATION_MISMATCH', 'BATCH_MISMATCH', 'UOM_MISMATCH', 'VISIBLE_DAMAGE', 'LABEL_MISMATCH', 'MIXED_MATERIAL', 'DOCUMENT_MISMATCH', 'UNKNOWN'];
const DAMAGE_TYPES = ['PACKAGING_DAMAGED', 'MATERIAL_DAMAGED'];
class RaiseDiscrepancyDto {
}
exports.RaiseDiscrepancyDto = RaiseDiscrepancyDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.0001),
    __metadata("design:type", Number)
], RaiseDiscrepancyDto.prototype, "affectedQty", void 0);
__decorate([
    (0, class_validator_1.IsIn)(PROBLEM_TYPES),
    __metadata("design:type", String)
], RaiseDiscrepancyDto.prototype, "problemType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(DAMAGE_TYPES),
    __metadata("design:type", String)
], RaiseDiscrepancyDto.prototype, "damageType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RaiseDiscrepancyDto.prototype, "physicalItemCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RaiseDiscrepancyDto.prototype, "physicalItemName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RaiseDiscrepancyDto.prototype, "physicalSpecification", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RaiseDiscrepancyDto.prototype, "physicalBatch", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RaiseDiscrepancyDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], RaiseDiscrepancyDto.prototype, "evidence", void 0);
class CorrectDiscrepancyDto {
}
exports.CorrectDiscrepancyDto = CorrectDiscrepancyDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CorrectDiscrepancyDto.prototype, "affectedQty", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CorrectDiscrepancyDto.prototype, "reason", void 0);
const PURCHASE_STATUSES = ['COMMERCIALLY_ACCEPTED', 'RETURN_REQUIRED', 'REPLACEMENT_REQUIRED'];
const QC_DECISIONS = ['ACCEPTED', 'REJECTED'];
const AUTHORIZATION_RESOLUTIONS = ['ACCEPT_AUTHORIZED', 'RECLASSIFY'];
exports.AUTHORIZATION_RESOLUTIONS = AUTHORIZATION_RESOLUTIONS;
const DIRECT_RESOLUTIONS = ['RETURN_TO_VENDOR', 'REPLACE', 'HOLD_INVESTIGATION', 'OTHER'];
exports.DIRECT_RESOLUTIONS = DIRECT_RESOLUTIONS;
class PurchaseReviewDto {
}
exports.PurchaseReviewDto = PurchaseReviewDto;
__decorate([
    (0, class_validator_1.IsIn)(PURCHASE_STATUSES),
    __metadata("design:type", String)
], PurchaseReviewDto.prototype, "purchaseStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PurchaseReviewDto.prototype, "remarks", void 0);
class QcReviewDto {
}
exports.QcReviewDto = QcReviewDto;
__decorate([
    (0, class_validator_1.IsIn)(QC_DECISIONS),
    __metadata("design:type", String)
], QcReviewDto.prototype, "qcStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QcReviewDto.prototype, "remarks", void 0);
class RequestResolutionDto {
}
exports.RequestResolutionDto = RequestResolutionDto;
__decorate([
    (0, class_validator_1.IsIn)(AUTHORIZATION_RESOLUTIONS),
    __metadata("design:type", String)
], RequestResolutionDto.prototype, "resolution", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestResolutionDto.prototype, "reason", void 0);
class DecideResolutionDto {
}
exports.DecideResolutionDto = DecideResolutionDto;
__decorate([
    (0, class_validator_1.IsIn)(['APPROVED', 'REJECTED']),
    __metadata("design:type", String)
], DecideResolutionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DecideResolutionDto.prototype, "comments", void 0);
class DirectResolveDto {
}
exports.DirectResolveDto = DirectResolveDto;
__decorate([
    (0, class_validator_1.IsIn)(DIRECT_RESOLUTIONS),
    __metadata("design:type", String)
], DirectResolveDto.prototype, "resolution", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DirectResolveDto.prototype, "reason", void 0);
class SegregateDiscrepancyDto {
}
exports.SegregateDiscrepancyDto = SegregateDiscrepancyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SegregateDiscrepancyDto.prototype, "binId", void 0);
//# sourceMappingURL=grn-discrepancy.dto.js.map