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
exports.ReturnGatePassDto = exports.CancelGatePassDto = exports.ApproveGatePassDto = exports.CreateGatePassDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateGatePassDto {
}
exports.CreateGatePassDto = CreateGatePassDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-plant' }),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "plantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.GatePassType, example: 'RETURNABLE' }),
    (0, class_validator_1.IsEnum)(client_1.GatePassType),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Taking laptop for client demo' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ramesh Kumar' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "carrierName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '9876543210' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "carrierMobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'AADHAAR: 1234-5678-9012' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "carrierIdProof", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'MH01AB1234' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Dell Laptop 15" + charger' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "itemDescription", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateGatePassDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'NOS' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 75000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateGatePassDto.prototype, "estimatedValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-06-10T18:00:00Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "validFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-06-15T18:00:00Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "validTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "remarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-of-employee' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'PERSONAL', enum: ['PERSONAL', 'OFFICIAL', 'MEDICAL', 'EMERGENCY'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "exitType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-06-10T18:00:00Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "expectedReturnTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Production' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGatePassDto.prototype, "departmentName", void 0);
class ApproveGatePassDto {
}
exports.ApproveGatePassDto = ApproveGatePassDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApproveGatePassDto.prototype, "remarks", void 0);
class CancelGatePassDto {
}
exports.CancelGatePassDto = CancelGatePassDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Request withdrawn by department' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CancelGatePassDto.prototype, "cancelReason", void 0);
class ReturnGatePassDto {
}
exports.ReturnGatePassDto = ReturnGatePassDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReturnGatePassDto.prototype, "remarks", void 0);
//# sourceMappingURL=gate-pass.dto.js.map