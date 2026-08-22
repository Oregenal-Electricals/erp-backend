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
exports.ConfirmTemplateImportDto = exports.ImportedTemplateDto = exports.ImportedTemplateParameterDto = exports.SubmitIqcStageResultDto = exports.IqcParameterResultDto = exports.UpdateIqcCheckTemplateDto = exports.CreateIqcCheckTemplateDto = exports.IqcCheckParameterDto = exports.AttachTemplateDto = exports.UpdateIqcItemsDto = exports.CreateIqcDto = exports.IqcItemUpdateDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class IqcItemUpdateDto {
}
exports.IqcItemUpdateDto = IqcItemUpdateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcItemUpdateDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], IqcItemUpdateDto.prototype, "acceptedQty", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], IqcItemUpdateDto.prototype, "rejectedQty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcItemUpdateDto.prototype, "rejectionReason", void 0);
class CreateIqcDto {
}
exports.CreateIqcDto = CreateIqcDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIqcDto.prototype, "grnId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIqcDto.prototype, "inspectedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIqcDto.prototype, "remarks", void 0);
class UpdateIqcItemsDto {
}
exports.UpdateIqcItemsDto = UpdateIqcItemsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => IqcItemUpdateDto),
    __metadata("design:type", Array)
], UpdateIqcItemsDto.prototype, "items", void 0);
class AttachTemplateDto {
}
exports.AttachTemplateDto = AttachTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttachTemplateDto.prototype, "templateId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AttachTemplateDto.prototype, "sampleSize", void 0);
class IqcCheckParameterDto {
}
exports.IqcCheckParameterDto = IqcCheckParameterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcCheckParameterDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], IqcCheckParameterDto.prototype, "sNo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcCheckParameterDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcCheckParameterDto.prototype, "parameterName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcCheckParameterDto.prototype, "specification", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], IqcCheckParameterDto.prototype, "sortOrder", void 0);
class CreateIqcCheckTemplateDto {
}
exports.CreateIqcCheckTemplateDto = CreateIqcCheckTemplateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIqcCheckTemplateDto.prototype, "rawMaterialId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIqcCheckTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIqcCheckTemplateDto.prototype, "docCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIqcCheckTemplateDto.prototype, "revision", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => IqcCheckParameterDto),
    __metadata("design:type", Array)
], CreateIqcCheckTemplateDto.prototype, "parameters", void 0);
class UpdateIqcCheckTemplateDto {
}
exports.UpdateIqcCheckTemplateDto = UpdateIqcCheckTemplateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIqcCheckTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIqcCheckTemplateDto.prototype, "docCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIqcCheckTemplateDto.prototype, "revision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => IqcCheckParameterDto),
    __metadata("design:type", Array)
], UpdateIqcCheckTemplateDto.prototype, "parameters", void 0);
class IqcParameterResultDto {
}
exports.IqcParameterResultDto = IqcParameterResultDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcParameterResultDto.prototype, "parameterId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcParameterResultDto.prototype, "s1", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcParameterResultDto.prototype, "s2", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcParameterResultDto.prototype, "s3", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcParameterResultDto.prototype, "s4", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcParameterResultDto.prototype, "s5", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IqcParameterResultDto.prototype, "remark", void 0);
class SubmitIqcStageResultDto {
}
exports.SubmitIqcStageResultDto = SubmitIqcStageResultDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitIqcStageResultDto.prototype, "outcome", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitIqcStageResultDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => IqcParameterResultDto),
    __metadata("design:type", Array)
], SubmitIqcStageResultDto.prototype, "parameterResults", void 0);
class ImportedTemplateParameterDto {
}
exports.ImportedTemplateParameterDto = ImportedTemplateParameterDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ImportedTemplateParameterDto.prototype, "sNo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportedTemplateParameterDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportedTemplateParameterDto.prototype, "parameterName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportedTemplateParameterDto.prototype, "specification", void 0);
class ImportedTemplateDto {
}
exports.ImportedTemplateDto = ImportedTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportedTemplateDto.prototype, "sheetName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportedTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportedTemplateDto.prototype, "docCode", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ImportedTemplateParameterDto),
    __metadata("design:type", Array)
], ImportedTemplateDto.prototype, "parameters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportedTemplateDto.prototype, "error", void 0);
class ConfirmTemplateImportDto {
}
exports.ConfirmTemplateImportDto = ConfirmTemplateImportDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ImportedTemplateDto),
    __metadata("design:type", Array)
], ConfirmTemplateImportDto.prototype, "templates", void 0);
//# sourceMappingURL=iqc.dto.js.map