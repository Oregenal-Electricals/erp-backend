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
exports.AddCommentDto = exports.ReviewChangeRequestDto = exports.UpdateChangeRequestDto = exports.CreateChangeRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateChangeRequestDto {
}
exports.CreateChangeRequestDto = CreateChangeRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Update Company GST Number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateChangeRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Need to update GSTIN from 27AABCA1234Z1ZX to new number',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], CreateChangeRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ChangeRequestType, example: 'MASTER_DATA' }),
    (0, class_validator_1.IsEnum)(client_1.ChangeRequestType),
    __metadata("design:type", String)
], CreateChangeRequestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'NORMAL',
        enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChangeRequestDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-03-31' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateChangeRequestDto.prototype, "dueDate", void 0);
class UpdateChangeRequestDto {
}
exports.UpdateChangeRequestDto = UpdateChangeRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateChangeRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], UpdateChangeRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ChangeRequestType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ChangeRequestType),
    __metadata("design:type", String)
], UpdateChangeRequestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateChangeRequestDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateChangeRequestDto.prototype, "dueDate", void 0);
class ReviewChangeRequestDto {
}
exports.ReviewChangeRequestDto = ReviewChangeRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Approved. Please proceed with the change.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], ReviewChangeRequestDto.prototype, "reviewComment", void 0);
class AddCommentDto {
}
exports.AddCommentDto = AddCommentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I have attached the supporting documents.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], AddCommentDto.prototype, "comment", void 0);
//# sourceMappingURL=change-request.dto.js.map