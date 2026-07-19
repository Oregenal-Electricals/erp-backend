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
exports.StartProductionDto = exports.CreateRoutingDto = exports.RoutingStageDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class RoutingStageDto {
}
exports.RoutingStageDto = RoutingStageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoutingStageDto.prototype, "stageName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoutingStageDto.prototype, "bomId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoutingStageDto.prototype, "warehouseId", void 0);
class CreateRoutingDto {
}
exports.CreateRoutingDto = CreateRoutingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoutingDto.prototype, "finalProductId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoutingDto.prototype, "routingName", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RoutingStageDto),
    __metadata("design:type", Array)
], CreateRoutingDto.prototype, "stages", void 0);
class StartProductionDto {
}
exports.StartProductionDto = StartProductionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartProductionDto.prototype, "routingId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.0001),
    __metadata("design:type", Number)
], StartProductionDto.prototype, "plannedQty", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartProductionDto.prototype, "warehouseId", void 0);
//# sourceMappingURL=routing.dto.js.map