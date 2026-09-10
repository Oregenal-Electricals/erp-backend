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
exports.CorrectDiscrepancyDto = exports.RaiseDiscrepancyDto = void 0;
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
//# sourceMappingURL=grn-discrepancy.dto.js.map