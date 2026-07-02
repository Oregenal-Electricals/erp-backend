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
exports.CancelPlanDto = exports.CreateDispatchPlanDto = exports.PlanItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class PlanItemDto {
}
exports.PlanItemDto = PlanItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlanItemDto.prototype, "soItemId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlanItemDto.prototype, "itemCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlanItemDto.prototype, "itemName", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PlanItemDto.prototype, "plannedQty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlanItemDto.prototype, "uom", void 0);
class CreateDispatchPlanDto {
}
exports.CreateDispatchPlanDto = CreateDispatchPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchPlanDto.prototype, "soId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDispatchPlanDto.prototype, "plannedDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchPlanDto.prototype, "deliveryAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['ROAD', 'RAIL', 'AIR', 'COURIER']),
    __metadata("design:type", String)
], CreateDispatchPlanDto.prototype, "transportMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchPlanDto.prototype, "transporterName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchPlanDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchPlanDto.prototype, "driverName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchPlanDto.prototype, "driverPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchPlanDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PlanItemDto),
    __metadata("design:type", Array)
], CreateDispatchPlanDto.prototype, "items", void 0);
class CancelPlanDto {
}
exports.CancelPlanDto = CancelPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelPlanDto.prototype, "cancelReason", void 0);
//# sourceMappingURL=dispatch-plan.dto.js.map