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
exports.BulkUpsertOverridesDto = exports.UpsertOverrideDto = exports.ReorderElementsDto = exports.ReorderItemDto = exports.UpdateElementDto = exports.CreateElementDto = exports.SyncElementsDto = exports.SyncElementDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const ELEMENT_TYPES = ['SIDEBAR_SECTION', 'SIDEBAR_ITEM', 'TAB', 'BUTTON', 'FIELD', 'COLUMN', 'SECTION', 'STAT_CARD'];
class SyncElementDto {
}
exports.SyncElementDto = SyncElementDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncElementDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsIn)(ELEMENT_TYPES),
    __metadata("design:type", String)
], SyncElementDto.prototype, "elementType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncElementDto.prototype, "module", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncElementDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncElementDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncElementDto.prototype, "icon", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncElementDto.prototype, "parentKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SyncElementDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SyncElementDto.prototype, "defaultVisible", void 0);
class SyncElementsDto {
}
exports.SyncElementsDto = SyncElementsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SyncElementDto),
    __metadata("design:type", Array)
], SyncElementsDto.prototype, "elements", void 0);
class CreateElementDto extends SyncElementDto {
}
exports.CreateElementDto = CreateElementDto;
class UpdateElementDto {
}
exports.UpdateElementDto = UpdateElementDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateElementDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateElementDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateElementDto.prototype, "icon", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateElementDto.prototype, "parentKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateElementDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateElementDto.prototype, "defaultVisible", void 0);
class ReorderItemDto {
}
exports.ReorderItemDto = ReorderItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReorderItemDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReorderItemDto.prototype, "parentKey", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ReorderItemDto.prototype, "sortOrder", void 0);
class ReorderElementsDto {
}
exports.ReorderElementsDto = ReorderElementsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ReorderItemDto),
    __metadata("design:type", Array)
], ReorderElementsDto.prototype, "items", void 0);
class UpsertOverrideDto {
}
exports.UpsertOverrideDto = UpsertOverrideDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertOverrideDto.prototype, "elementId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['ROLE', 'USER']),
    __metadata("design:type", String)
], UpsertOverrideDto.prototype, "scopeType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertOverrideDto.prototype, "roleName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertOverrideDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertOverrideDto.prototype, "isVisible", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertOverrideDto.prototype, "customLabel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertOverrideDto.prototype, "parentKeyOverride", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertOverrideDto.prototype, "customPage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpsertOverrideDto.prototype, "sortOrderOverride", void 0);
class BulkUpsertOverridesDto {
}
exports.BulkUpsertOverridesDto = BulkUpsertOverridesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpsertOverrideDto),
    __metadata("design:type", Array)
], BulkUpsertOverridesDto.prototype, "overrides", void 0);
//# sourceMappingURL=ui-control.dto.js.map