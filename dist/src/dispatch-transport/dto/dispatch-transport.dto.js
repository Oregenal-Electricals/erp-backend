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
exports.CancelAssignmentDto = exports.ReassignVehicleDto = exports.AssignPackageDto = exports.CreateTransportAssignmentDto = void 0;
const class_validator_1 = require("class-validator");
class CreateTransportAssignmentDto {
}
exports.CreateTransportAssignmentDto = CreateTransportAssignmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransportAssignmentDto.prototype, "dispatchPlanId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['TRANSPORTER_VEHICLE', 'OWN_VEHICLE', 'CUSTOMER_PICKUP']),
    __metadata("design:type", String)
], CreateTransportAssignmentDto.prototype, "transportType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransportAssignmentDto.prototype, "transporterName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransportAssignmentDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransportAssignmentDto.prototype, "vehicleType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransportAssignmentDto.prototype, "driverName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransportAssignmentDto.prototype, "driverPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransportAssignmentDto.prototype, "lrNumber", void 0);
class AssignPackageDto {
}
exports.AssignPackageDto = AssignPackageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignPackageDto.prototype, "packageId", void 0);
class ReassignVehicleDto {
}
exports.ReassignVehicleDto = ReassignVehicleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReassignVehicleDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReassignVehicleDto.prototype, "vehicleType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReassignVehicleDto.prototype, "driverName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReassignVehicleDto.prototype, "driverPhone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReassignVehicleDto.prototype, "reason", void 0);
class CancelAssignmentDto {
}
exports.CancelAssignmentDto = CancelAssignmentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelAssignmentDto.prototype, "reason", void 0);
//# sourceMappingURL=dispatch-transport.dto.js.map