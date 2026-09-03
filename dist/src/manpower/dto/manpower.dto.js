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
exports.EndAssignmentDto = exports.AssignEmployeesDto = exports.TransferManpowerDto = exports.AdjustManpowerDto = exports.ResolveManpowerQueryDto = exports.RaiseManpowerQueryDto = exports.DistributeManpowerDto = exports.CreateManpowerAllocationDto = void 0;
const class_validator_1 = require("class-validator");
const LEVELS = ['HR_TO_PLANT', 'PLANT_TO_STAGE', 'STAGE_TO_LINE'];
class CreateManpowerAllocationDto {
}
exports.CreateManpowerAllocationDto = CreateManpowerAllocationDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateManpowerAllocationDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsIn)(LEVELS),
    __metadata("design:type", String)
], CreateManpowerAllocationDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateManpowerAllocationDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateManpowerAllocationDto.prototype, "toUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateManpowerAllocationDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateManpowerAllocationDto.prototype, "count", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateManpowerAllocationDto.prototype, "remarks", void 0);
class DistributeManpowerDto {
}
exports.DistributeManpowerDto = DistributeManpowerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DistributeManpowerDto.prototype, "parentId", void 0);
class RaiseManpowerQueryDto {
}
exports.RaiseManpowerQueryDto = RaiseManpowerQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RaiseManpowerQueryDto.prototype, "allocationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RaiseManpowerQueryDto.prototype, "message", void 0);
class ResolveManpowerQueryDto {
}
exports.ResolveManpowerQueryDto = ResolveManpowerQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveManpowerQueryDto.prototype, "response", void 0);
class AdjustManpowerDto {
}
exports.AdjustManpowerDto = AdjustManpowerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdjustManpowerDto.prototype, "allocationId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AdjustManpowerDto.prototype, "delta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdjustManpowerDto.prototype, "reason", void 0);
class TransferManpowerDto {
}
exports.TransferManpowerDto = TransferManpowerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferManpowerDto.prototype, "allocationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferManpowerDto.prototype, "toWorkOrderId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], TransferManpowerDto.prototype, "qty", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferManpowerDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TransferManpowerDto.prototype, "effectiveAt", void 0);
const ACTIVITY_TYPES = [
    'PRODUCTION', 'QUALITY_INSPECTION', 'REWORK', 'REPAIR', 'MACHINE_SETUP',
    'LINE_CHANGEOVER', 'MAINTENANCE', 'BREAKDOWN_SUPPORT', 'MATERIAL_HANDLING',
    'STORE', 'INVENTORY_COUNTING', 'PACKING', 'DISPATCH_SUPPORT', 'LOADING_UNLOADING',
    'TRAINING', 'MEETING', 'CLEANING_5S', 'TRIAL_PRODUCTION', 'SAMPLE_PRODUCTION',
    'TEA_BREAK', 'LUNCH_BREAK', 'APPROVED_WAITING', 'OTHER_APPROVED',
];
class AssignEmployeesDto {
}
exports.AssignEmployeesDto = AssignEmployeesDto;
__decorate([
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AssignEmployeesDto.prototype, "employeeIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignEmployeesDto.prototype, "allocationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignEmployeesDto.prototype, "workOrderId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignEmployeesDto.prototype, "stageName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(ACTIVITY_TYPES),
    __metadata("design:type", String)
], AssignEmployeesDto.prototype, "activityType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AssignEmployeesDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AssignEmployeesDto.prototype, "plannedEndTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignEmployeesDto.prototype, "remarks", void 0);
class EndAssignmentDto {
}
exports.EndAssignmentDto = EndAssignmentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], EndAssignmentDto.prototype, "endTime", void 0);
//# sourceMappingURL=manpower.dto.js.map