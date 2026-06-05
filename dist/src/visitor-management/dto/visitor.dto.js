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
exports.CheckOutVisitorDto = exports.CheckInVisitorDto = exports.UpdateVisitorDto = exports.CreateVisitorDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateVisitorDto {
}
exports.CreateVisitorDto = CreateVisitorDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rajesh' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateVisitorDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Kumar' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateVisitorDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9876543210' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[6-9]\d{9}$/, { message: 'Enter valid 10-digit mobile number' }),
    __metadata("design:type", String)
], CreateVisitorDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'rajesh@vendor.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateVisitorDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Vendor Electronics Ltd' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVisitorDto.prototype, "visitorCompany", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sales Manager' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVisitorDto.prototype, "designation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.IdProofType, example: 'AADHAAR' }),
    (0, class_validator_1.IsEnum)(client_1.IdProofType),
    __metadata("design:type", String)
], CreateVisitorDto.prototype, "idProofType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1234-5678-9012' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    __metadata("design:type", String)
], CreateVisitorDto.prototype, "idProofNumber", void 0);
class UpdateVisitorDto {
}
exports.UpdateVisitorDto = UpdateVisitorDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVisitorDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVisitorDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVisitorDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateVisitorDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVisitorDto.prototype, "visitorCompany", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVisitorDto.prototype, "designation", void 0);
class CheckInVisitorDto {
}
exports.CheckInVisitorDto = CheckInVisitorDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-visitor' }),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CheckInVisitorDto.prototype, "visitorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-plant' }),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CheckInVisitorDto.prototype, "plantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-of-host-employee' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CheckInVisitorDto.prototype, "hostEmployeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Business meeting with purchase team' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CheckInVisitorDto.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'MH01AB1234' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckInVisitorDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Laptop, Documents' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckInVisitorDto.prototype, "itemsCarried", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Purchase Dept, Conference Room' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckInVisitorDto.prototype, "areasToVisit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CheckInVisitorDto.prototype, "expectedOutTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckInVisitorDto.prototype, "remarks", void 0);
class CheckOutVisitorDto {
}
exports.CheckOutVisitorDto = CheckOutVisitorDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Completed meeting, returned laptop' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckOutVisitorDto.prototype, "remarks", void 0);
//# sourceMappingURL=visitor.dto.js.map