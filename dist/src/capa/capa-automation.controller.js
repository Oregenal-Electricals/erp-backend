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
exports.CapaAutomationController = void 0;
const common_1 = require("@nestjs/common");
const capa_automation_service_1 = require("./capa-automation.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let CapaAutomationController = class CapaAutomationController {
    constructor(capaAutoService) {
        this.capaAutoService = capaAutoService;
    }
    autoCreate(ncrId, req) { return this.capaAutoService.autoCreateFromNcr(ncrId, req.user); }
    checkEscalations(req) { return this.capaAutoService.checkEscalations(req.user.companyId); }
    checkEffectiveness(capaId, req) { return this.capaAutoService.checkEffectiveness(capaId, req.user); }
    getHealthScore(req) { return this.capaAutoService.getHealthScore(req.user.companyId); }
};
exports.CapaAutomationController = CapaAutomationController;
__decorate([
    (0, common_1.Post)('auto-create/:ncrId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Param)('ncrId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CapaAutomationController.prototype, "autoCreate", null);
__decorate([
    (0, common_1.Get)('escalations'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CapaAutomationController.prototype, "checkEscalations", null);
__decorate([
    (0, common_1.Get)('effectiveness/:capaId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('capaId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CapaAutomationController.prototype, "checkEffectiveness", null);
__decorate([
    (0, common_1.Get)('health-score'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CapaAutomationController.prototype, "getHealthScore", null);
exports.CapaAutomationController = CapaAutomationController = __decorate([
    (0, common_1.Controller)('capa-automation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [capa_automation_service_1.CapaAutomationService])
], CapaAutomationController);
//# sourceMappingURL=capa-automation.controller.js.map