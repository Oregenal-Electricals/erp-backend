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
exports.UpdateAlertDto = exports.BulkReadingDto = exports.PostReadingDto = exports.CreateMachineDto = void 0;
const class_validator_1 = require("class-validator");
const MACHINE_TYPES = ['CNC', 'SMT', 'ASSEMBLY', 'TESTING', 'CONVEYOR', 'INJECTION', 'WELDING', 'GENERAL'];
const STATUSES = ['ONLINE', 'OFFLINE', 'IDLE', 'RUNNING', 'ERROR', 'MAINTENANCE'];
const READING_TYPES = ['TEMPERATURE', 'SPEED', 'VIBRATION', 'CURRENT', 'PRESSURE', 'OUTPUT_COUNT', 'CYCLE_TIME'];
class CreateMachineDto {
}
exports.CreateMachineDto = CreateMachineDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMachineDto.prototype, "machineCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMachineDto.prototype, "machineName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(MACHINE_TYPES),
    __metadata("design:type", String)
], CreateMachineDto.prototype, "machineType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMachineDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMachineDto.prototype, "manufacturer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMachineDto.prototype, "modelNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMachineDto.prototype, "ipAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMachineDto.prototype, "apiEndpoint", void 0);
class PostReadingDto {
}
exports.PostReadingDto = PostReadingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostReadingDto.prototype, "machineId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(READING_TYPES),
    __metadata("design:type", String)
], PostReadingDto.prototype, "readingType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PostReadingDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostReadingDto.prototype, "unit", void 0);
class BulkReadingDto {
}
exports.BulkReadingDto = BulkReadingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkReadingDto.prototype, "machineId", void 0);
class UpdateAlertDto {
}
exports.UpdateAlertDto = UpdateAlertDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['ACKNOWLEDGED', 'RESOLVED']),
    __metadata("design:type", String)
], UpdateAlertDto.prototype, "status", void 0);
//# sourceMappingURL=iot.dto.js.map