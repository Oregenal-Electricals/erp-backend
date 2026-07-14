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
exports.InventoryDashboardController = void 0;
const common_1 = require("@nestjs/common");
const inventory_dashboard_service_1 = require("./inventory-dashboard.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let InventoryDashboardController = class InventoryDashboardController {
    constructor(idService) {
        this.idService = idService;
    }
    getOverview(req) { return this.idService.getOverview(req.user); }
    getAlerts(req) { return this.idService.getAlerts(req.user); }
    getActivity(req) { return this.idService.getActivity(req.user); }
    getTopItems(req) { return this.idService.getTopItems(req.user); }
};
exports.InventoryDashboardController = InventoryDashboardController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_DASHBOARD_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryDashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_DASHBOARD_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryDashboardController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('activity'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_DASHBOARD_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryDashboardController.prototype, "getActivity", null);
__decorate([
    (0, common_1.Get)('top-items'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_DASHBOARD_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryDashboardController.prototype, "getTopItems", null);
exports.InventoryDashboardController = InventoryDashboardController = __decorate([
    (0, common_1.Controller)('inventory-dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [inventory_dashboard_service_1.InventoryDashboardService])
], InventoryDashboardController);
//# sourceMappingURL=inventory-dashboard.controller.js.map