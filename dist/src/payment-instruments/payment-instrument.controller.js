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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentInstrumentController = void 0;
const common_1 = require("@nestjs/common");
const payment_instrument_service_1 = require("./payment-instrument.service");
const payment_instrument_dto_1 = require("./dto/payment-instrument.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let PaymentInstrumentController = class PaymentInstrumentController {
    constructor(piService) {
        this.piService = piService;
    }
    getStats(req) { return this.piService.getStats(req.user); }
    findAll(req, query) { return this.piService.findAll(req.user, query); }
    findByIpo(ipoId, req) { return this.piService.findByIpo(ipoId, req.user); }
    findOne(id, req) { return this.piService.findOne(id, req.user); }
    create(dto, req) { return this.piService.create(dto, req.user); }
    update(id, dto, req) { return this.piService.update(id, dto, req.user); }
    open(id, req) { return this.piService.open(id, req.user); }
    settle(id, req) { return this.piService.settle(id, req.user); }
    cancel(id, req) { return this.piService.cancel(id, req.user); }
};
exports.PaymentInstrumentController = PaymentInstrumentController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentInstrumentController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentInstrumentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('ipo/:ipoId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Param)('ipoId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentInstrumentController.prototype, "findByIpo", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentInstrumentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_instrument_dto_1.CreatePaymentInstrumentDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentInstrumentController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_instrument_dto_1.UpdatePaymentInstrumentDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentInstrumentController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/open'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentInstrumentController.prototype, "open", null);
__decorate([
    (0, common_1.Post)(':id/settle'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentInstrumentController.prototype, "settle", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentInstrumentController.prototype, "cancel", null);
exports.PaymentInstrumentController = PaymentInstrumentController = __decorate([
    (0, common_1.Controller)('payment-instruments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [payment_instrument_service_1.PaymentInstrumentService])
], PaymentInstrumentController);
//# sourceMappingURL=payment-instrument.controller.js.map