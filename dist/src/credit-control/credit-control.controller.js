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
exports.CreditControlController = void 0;
const common_1 = require("@nestjs/common");
const credit_control_service_1 = require("./credit-control.service");
const credit_control_dto_1 = require("./dto/credit-control.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let CreditControlController = class CreditControlController {
    constructor(ccService) {
        this.ccService = ccService;
    }
    getStats(req) { return this.ccService.getStats(req.user); }
    getDashboard(req) { return this.ccService.getDashboard(req.user); }
    getPosition(customerName, req) { return this.ccService.getCustomerPosition(customerName, req.user.companyId); }
    findAllLimits(req) { return this.ccService.findAllLimits(req.user); }
    findAllHolds(req, query) { return this.ccService.findAllHolds(req.user, query); }
    checkCredit(dto, req) { return this.ccService.checkCredit(dto, req.user); }
    createLimit(dto, req) { return this.ccService.createCreditLimit(dto, req.user); }
    updateLimit(id, dto, req) { return this.ccService.updateCreditLimit(id, dto, req.user); }
    releaseHold(id, dto, req) { return this.ccService.releaseHold(id, dto, req.user); }
};
exports.CreditControlController = CreditControlController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CreditControlController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CreditControlController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('position/:customerName'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('customerName')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CreditControlController.prototype, "getPosition", null);
__decorate([
    (0, common_1.Get)('limits'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CreditControlController.prototype, "findAllLimits", null);
__decorate([
    (0, common_1.Get)('holds'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CreditControlController.prototype, "findAllHolds", null);
__decorate([
    (0, common_1.Post)('check'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [credit_control_dto_1.CheckCreditDto, Object]),
    __metadata("design:returntype", void 0)
], CreditControlController.prototype, "checkCredit", null);
__decorate([
    (0, common_1.Post)('limits'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [credit_control_dto_1.CreateCreditLimitDto, Object]),
    __metadata("design:returntype", void 0)
], CreditControlController.prototype, "createLimit", null);
__decorate([
    (0, common_1.Put)('limits/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, credit_control_dto_1.UpdateCreditLimitDto, Object]),
    __metadata("design:returntype", void 0)
], CreditControlController.prototype, "updateLimit", null);
__decorate([
    (0, common_1.Post)('holds/:id/release'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, credit_control_dto_1.ReleaseCreditHoldDto, Object]),
    __metadata("design:returntype", void 0)
], CreditControlController.prototype, "releaseHold", null);
exports.CreditControlController = CreditControlController = __decorate([
    (0, common_1.Controller)('credit-control'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [credit_control_service_1.CreditControlService])
], CreditControlController);
//# sourceMappingURL=credit-control.controller.js.map