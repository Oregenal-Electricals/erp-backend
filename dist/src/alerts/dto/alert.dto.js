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
exports.TriggerAlertDto = exports.UpdateAlertTemplateDto = exports.CreateAlertTemplateDto = void 0;
const class_validator_1 = require("class-validator");
const EVENT_TYPES = ['INVOICE_OVERDUE', 'DISPATCH_CREATED', 'PAYMENT_RECEIVED', 'CREDIT_HOLD', 'LOW_STOCK', 'PO_APPROVED', 'SO_CONFIRMED', 'DELIVERY_CONFIRMED', 'NCR_RAISED', 'CAPA_OVERDUE'];
const CHANNELS = ['EMAIL', 'SMS', 'BOTH'];
const RECIPIENTS = ['CUSTOMER', 'INTERNAL', 'BOTH'];
class CreateAlertTemplateDto {
}
exports.CreateAlertTemplateDto = CreateAlertTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(EVENT_TYPES),
    __metadata("design:type", String)
], CreateAlertTemplateDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(CHANNELS),
    __metadata("design:type", String)
], CreateAlertTemplateDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertTemplateDto.prototype, "bodyTemplate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(RECIPIENTS),
    __metadata("design:type", String)
], CreateAlertTemplateDto.prototype, "recipients", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertTemplateDto.prototype, "recipientEmails", void 0);
class UpdateAlertTemplateDto {
}
exports.UpdateAlertTemplateDto = UpdateAlertTemplateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAlertTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAlertTemplateDto.prototype, "bodyTemplate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(RECIPIENTS),
    __metadata("design:type", String)
], UpdateAlertTemplateDto.prototype, "recipients", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAlertTemplateDto.prototype, "recipientEmails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAlertTemplateDto.prototype, "isActive", void 0);
class TriggerAlertDto {
}
exports.TriggerAlertDto = TriggerAlertDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TriggerAlertDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TriggerAlertDto.prototype, "referenceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TriggerAlertDto.prototype, "referenceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TriggerAlertDto.prototype, "referenceNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TriggerAlertDto.prototype, "variables", void 0);
//# sourceMappingURL=alert.dto.js.map