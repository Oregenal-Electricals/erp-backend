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
exports.CorrectGateEventDto = exports.CreateGateEventDto = void 0;
const class_validator_1 = require("class-validator");
const EVENT_TYPES = [
    'PERSON_IN', 'PERSON_OUT', 'VEHICLE_ARRIVED', 'VEHICLE_IN', 'VEHICLE_OUT', 'VEHICLE_PREMISES_OUT',
    'VISITOR_IN', 'VISITOR_OUT', 'MATERIAL_IN', 'MATERIAL_OUT', 'DISPATCH_OUT',
    'RGP_OUT', 'RGP_RETURN', 'SCRAP_OUT', 'DENIED_ENTRY', 'EMERGENCY_ENTRY',
];
const SOURCES = ['MANUAL', 'BIOMETRIC', 'QR', 'SYSTEM'];
class CreateGateEventDto {
}
exports.CreateGateEventDto = CreateGateEventDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "plantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "gateId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(EVENT_TYPES),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "referenceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "referenceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "personId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "personName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "vehicleId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "eventTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(SOURCES),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGateEventDto.prototype, "remarks", void 0);
class CorrectGateEventDto {
}
exports.CorrectGateEventDto = CorrectGateEventDto;
__decorate([
    (0, class_validator_1.IsIn)(EVENT_TYPES),
    __metadata("design:type", String)
], CorrectGateEventDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CorrectGateEventDto.prototype, "referenceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CorrectGateEventDto.prototype, "referenceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CorrectGateEventDto.prototype, "personId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CorrectGateEventDto.prototype, "personName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CorrectGateEventDto.prototype, "vehicleId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CorrectGateEventDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CorrectGateEventDto.prototype, "remarks", void 0);
//# sourceMappingURL=gate-event.dto.js.map