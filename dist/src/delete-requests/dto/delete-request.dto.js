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
exports.RejectDeleteRequestDto = exports.CreateDeleteRequestDto = void 0;
const class_validator_1 = require("class-validator");
class CreateDeleteRequestDto {
}
exports.CreateDeleteRequestDto = CreateDeleteRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeleteRequestDto.prototype, "tableName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeleteRequestDto.prototype, "recordId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5, { message: 'Give a real reason (at least 5 characters) - this is what the approver sees' }),
    __metadata("design:type", String)
], CreateDeleteRequestDto.prototype, "reason", void 0);
class RejectDeleteRequestDto {
}
exports.RejectDeleteRequestDto = RejectDeleteRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RejectDeleteRequestDto.prototype, "comments", void 0);
//# sourceMappingURL=delete-request.dto.js.map