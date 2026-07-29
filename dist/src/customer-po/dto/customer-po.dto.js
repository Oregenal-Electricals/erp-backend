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
exports.CreateQuantityIncreaseDto = exports.CancelCpoDto = exports.UpdateCpoDto = exports.CreateCpoDto = exports.CpoItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CpoItemDto {
}
exports.CpoItemDto = CpoItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CpoItemDto.prototype, "itemCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CpoItemDto.prototype, "itemName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CpoItemDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CpoItemDto.prototype, "qty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CpoItemDto.prototype, "uom", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CpoItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CpoItemDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CpoItemDto.prototype, "gstRate", void 0);
class CreateCpoDto {
}
exports.CreateCpoDto = CreateCpoDto;
__decorate([
    (0, class_validator_1.IsIn)(['WRITTEN', 'VERBAL']),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "poType", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)(o => o.poType === 'WRITTEN'),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "customerPoNumber", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)(o => o.poType === 'VERBAL'),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "verbalConfirmedBy", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)(o => o.poType === 'VERBAL'),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "verbalConfirmedDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "quotationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "customerEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "customerPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "deliveryAddress", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "poDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "deliveryDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCpoDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CpoItemDto),
    __metadata("design:type", Array)
], CreateCpoDto.prototype, "items", void 0);
class UpdateCpoDto {
}
exports.UpdateCpoDto = UpdateCpoDto;
__decorate([
    (0, class_validator_1.IsIn)(['WRITTEN', 'VERBAL']),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "poType", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)(o => o.poType === 'WRITTEN'),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "customerPoNumber", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)(o => o.poType === 'VERBAL'),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "verbalConfirmedBy", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)(o => o.poType === 'VERBAL'),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "verbalConfirmedDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "quotationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "customerEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "customerPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "deliveryAddress", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "poDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "deliveryDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCpoDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CpoItemDto),
    __metadata("design:type", Array)
], UpdateCpoDto.prototype, "items", void 0);
class CancelCpoDto {
}
exports.CancelCpoDto = CancelCpoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelCpoDto.prototype, "cancelReason", void 0);
class CreateQuantityIncreaseDto {
}
exports.CreateQuantityIncreaseDto = CreateQuantityIncreaseDto;
__decorate([
    (0, class_validator_1.IsIn)(['WRITTEN', 'VERBAL']),
    __metadata("design:type", String)
], CreateQuantityIncreaseDto.prototype, "poType", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)(o => o.poType === 'WRITTEN'),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuantityIncreaseDto.prototype, "customerPoNumber", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)(o => o.poType === 'VERBAL'),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuantityIncreaseDto.prototype, "verbalConfirmedBy", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)(o => o.poType === 'VERBAL'),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateQuantityIncreaseDto.prototype, "verbalConfirmedDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateQuantityIncreaseDto.prototype, "deliveryDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuantityIncreaseDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CpoItemDto),
    __metadata("design:type", Array)
], CreateQuantityIncreaseDto.prototype, "items", void 0);
//# sourceMappingURL=customer-po.dto.js.map