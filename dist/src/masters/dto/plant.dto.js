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
exports.UpdatePlantDto = exports.CreatePlantDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreatePlantDto {
}
exports.CreatePlantDto = CreatePlantDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PLT002' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pune Manufacturing Plant' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '27AABCA1234Z1ZX' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
        message: 'Invalid GSTIN format',
    }),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "gstin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '456 MIDC, Pimpri' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pune' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Maharashtra' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'India' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '411018' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9]{6}$/, { message: 'Pincode must be exactly 6 digits' }),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email address' }),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['MANUFACTURING', 'WAREHOUSE', 'OFFICE'],
        default: 'MANUFACTURING',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "plantType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'aaba1738-6e81-44f7-b630-aa0327620870' }),
    (0, class_validator_1.IsUUID)('4', { message: 'companyId must be a valid UUID' }),
    __metadata("design:type", String)
], CreatePlantDto.prototype, "companyId", void 0);
class UpdatePlantDto extends (0, swagger_1.PartialType)(CreatePlantDto) {
}
exports.UpdatePlantDto = UpdatePlantDto;
//# sourceMappingURL=plant.dto.js.map