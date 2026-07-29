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
exports.UpdateFinancialYearDto = exports.CreateFinancialYearDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateFinancialYearDto {
}
exports.CreateFinancialYearDto = CreateFinancialYearDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'FY2025-26' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFinancialYearDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-2026' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFinancialYearDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-04-01' }),
    (0, class_validator_1.IsDateString)({}, { message: 'startDate must be a valid date (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], CreateFinancialYearDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-03-31' }),
    (0, class_validator_1.IsDateString)({}, { message: 'endDate must be a valid date (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], CreateFinancialYearDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'aaba1738-6e81-44f7-b630-aa0327620870' }),
    (0, class_validator_1.IsUUID)('4', { message: 'companyId must be a valid UUID' }),
    __metadata("design:type", String)
], CreateFinancialYearDto.prototype, "companyId", void 0);
class UpdateFinancialYearDto extends (0, swagger_1.PartialType)(CreateFinancialYearDto) {
}
exports.UpdateFinancialYearDto = UpdateFinancialYearDto;
//# sourceMappingURL=financial-year.dto.js.map