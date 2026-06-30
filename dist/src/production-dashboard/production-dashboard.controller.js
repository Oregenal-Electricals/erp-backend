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
exports.ProductionDashboardController = void 0;
const common_1 = require("@nestjs/common");
const production_dashboard_service_1 = require("./production-dashboard.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let ProductionDashboardController = class ProductionDashboardController {
    constructor(pdService) {
        this.pdService = pdService;
    }
    getOverview(req) { return this.pdService.getOverview(req.user); }
    getActiveWos(req) { return this.pdService.getActiveWos(req.user); }
    getToday(req) { return this.pdService.getToday(req.user); }
    getAlerts(req) { return this.pdService.getAlerts(req.user); }
    getQuality(req) { return this.pdService.getQualityMetrics(req.user); }
};
exports.ProductionDashboardController = ProductionDashboardController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductionDashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('active-wos'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductionDashboardController.prototype, "getActiveWos", null);
__decorate([
    (0, common_1.Get)('today'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductionDashboardController.prototype, "getToday", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductionDashboardController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('quality'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductionDashboardController.prototype, "getQuality", null);
exports.ProductionDashboardController = ProductionDashboardController = __decorate([
    (0, common_1.Controller)('production-dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [production_dashboard_service_1.ProductionDashboardService])
], ProductionDashboardController);
//# sourceMappingURL=production-dashboard.controller.js.map