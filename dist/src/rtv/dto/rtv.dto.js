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
exports.GateOutRtvDto = exports.PrepareRtvDto = exports.DecideRtvDto = exports.RequestRtvDto = void 0;
const class_validator_1 = require("class-validator");
const RTV_REASONS = [
    'IQC_FAILED', 'WRONG_SPECIFICATION', 'DAMAGE', 'WRONG_MATERIAL',
    'SUPPLIER_QUALITY_REJECTION', 'EXCESS_MATERIAL_RETURN', 'OTHER',
];
class RequestRtvDto {
}
exports.RequestRtvDto = RequestRtvDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestRtvDto.prototype, "rejectedStockItemId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.0001),
    __metadata("design:type", Number)
], RequestRtvDto.prototype, "requestedQty", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(RTV_REASONS),
    __metadata("design:type", String)
], RequestRtvDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestRtvDto.prototype, "remarks", void 0);
class DecideRtvDto {
}
exports.DecideRtvDto = DecideRtvDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['AUTHORIZED', 'REJECTED']),
    __metadata("design:type", String)
], DecideRtvDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DecideRtvDto.prototype, "approvedQty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DecideRtvDto.prototype, "comments", void 0);
class PrepareRtvDto {
}
exports.PrepareRtvDto = PrepareRtvDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.0001),
    __metadata("design:type", Number)
], PrepareRtvDto.prototype, "preparedQty", void 0);
class GateOutRtvDto {
}
exports.GateOutRtvDto = GateOutRtvDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.0001),
    __metadata("design:type", Number)
], GateOutRtvDto.prototype, "qty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GateOutRtvDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GateOutRtvDto.prototype, "challanNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GateOutRtvDto.prototype, "remarks", void 0);
//# sourceMappingURL=rtv.dto.js.map