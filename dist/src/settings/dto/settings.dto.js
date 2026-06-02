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
exports.UpdateNumberingSeriesDto = exports.CreateNumberingSeriesDto = exports.BulkUpdateSettingsDto = exports.UpdateSystemSettingDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateSystemSettingDto {
}
exports.UpdateSystemSettingDto = UpdateSystemSettingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Smart Manufacturing ERP' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSystemSettingDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSystemSettingDto.prototype, "description", void 0);
class BulkUpdateSettingsDto {
}
exports.BulkUpdateSettingsDto = BulkUpdateSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: { app_name: 'Smart ERP', timezone: 'Asia/Kolkata' },
    }),
    __metadata("design:type", Object)
], BulkUpdateSettingsDto.prototype, "settings", void 0);
class CreateNumberingSeriesDto {
}
exports.CreateNumberingSeriesDto = CreateNumberingSeriesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'aaba1738-6e81-44f7-b630-aa0327620870' }),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CreateNumberingSeriesDto.prototype, "companyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'PO',
        description: 'Document type: PO, GRN, INV, WO, DC',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], CreateNumberingSeriesDto.prototype, "documentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PO' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], CreateNumberingSeriesDto.prototype, "prefix", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '-', default: '-' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2),
    __metadata("design:type", String)
], CreateNumberingSeriesDto.prototype, "separator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateNumberingSeriesDto.prototype, "includeYear", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'YY-YY',
        description: 'YY-YY = 24-25, YYYY = 2025',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNumberingSeriesDto.prototype, "yearFormat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 4, description: 'Digit padding: 4 = 0001' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], CreateNumberingSeriesDto.prototype, "padding", void 0);
class UpdateNumberingSeriesDto extends (0, swagger_1.PartialType)(CreateNumberingSeriesDto) {
}
exports.UpdateNumberingSeriesDto = UpdateNumberingSeriesDto;
//# sourceMappingURL=settings.dto.js.map