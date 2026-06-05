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
exports.LogVehicleExitDto = exports.LogVehicleEntryDto = exports.UpdateVehicleDto = exports.CreateVehicleDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateVehicleDto {
}
exports.CreateVehicleDto = CreateVehicleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MH01AB1234' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.VehicleType, example: 'TRUCK' }),
    (0, class_validator_1.IsEnum)(client_1.VehicleType),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "vehicleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Rajan Transport' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "ownerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '9876543210' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "ownerMobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateVehicleDto.prototype, "isCompanyVehicle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVehicleDto.prototype, "remarks", void 0);
class UpdateVehicleDto {
}
exports.UpdateVehicleDto = UpdateVehicleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.VehicleType),
    __metadata("design:type", String)
], UpdateVehicleDto.prototype, "vehicleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVehicleDto.prototype, "ownerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVehicleDto.prototype, "ownerMobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateVehicleDto.prototype, "isCompanyVehicle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVehicleDto.prototype, "remarks", void 0);
class LogVehicleEntryDto {
}
exports.LogVehicleEntryDto = LogVehicleEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-vehicle' }),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "vehicleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-plant' }),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "plantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Suresh Kumar' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "driverName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '9876543210' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "driverMobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'MH1234567890' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "driverLicense", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.VehiclePurpose, example: 'INWARD' }),
    (0, class_validator_1.IsEnum)(client_1.VehiclePurpose),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5200.5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LogVehicleEntryDto.prototype, "inWeight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Steel Rods - 50 bundles' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "materialDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ABC Steel Suppliers' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "supplierName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'XYZ Customer Ltd' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'PO-26-27-0001' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "poNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "remarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], LogVehicleEntryDto.prototype, "expectedExitTime", void 0);
class LogVehicleExitDto {
}
exports.LogVehicleExitDto = LogVehicleExitDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3200.5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LogVehicleExitDto.prototype, "outWeight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogVehicleExitDto.prototype, "remarks", void 0);
//# sourceMappingURL=vehicle.dto.js.map