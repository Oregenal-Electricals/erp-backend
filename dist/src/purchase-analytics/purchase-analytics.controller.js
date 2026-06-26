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
exports.PurchaseAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const purchase_analytics_service_1 = require("./purchase-analytics.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let PurchaseAnalyticsController = class PurchaseAnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getOverview(req) { return this.analyticsService.getOverview(req.user); }
    getSpendByVendor(req, limit) { return this.analyticsService.getSpendByVendor(req.user, limit ? parseInt(limit) : 10); }
    getSpendByMonth(req) { return this.analyticsService.getSpendByMonth(req.user); }
    getPoStatusDistribution(req) { return this.analyticsService.getPoStatusDistribution(req.user); }
    getPrToPoTime(req) { return this.analyticsService.getPrToPoTime(req.user); }
    getRfqConversion(req) { return this.analyticsService.getRfqConversion(req.user); }
    getTopItems(req, limit) { return this.analyticsService.getTopItems(req.user, limit ? parseInt(limit) : 10); }
};
exports.PurchaseAnalyticsController = PurchaseAnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchaseAnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('spend-by-vendor'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PurchaseAnalyticsController.prototype, "getSpendByVendor", null);
__decorate([
    (0, common_1.Get)('spend-by-month'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchaseAnalyticsController.prototype, "getSpendByMonth", null);
__decorate([
    (0, common_1.Get)('po-status'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchaseAnalyticsController.prototype, "getPoStatusDistribution", null);
__decorate([
    (0, common_1.Get)('pr-to-po-time'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchaseAnalyticsController.prototype, "getPrToPoTime", null);
__decorate([
    (0, common_1.Get)('rfq-conversion'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchaseAnalyticsController.prototype, "getRfqConversion", null);
__decorate([
    (0, common_1.Get)('top-items'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PurchaseAnalyticsController.prototype, "getTopItems", null);
exports.PurchaseAnalyticsController = PurchaseAnalyticsController = __decorate([
    (0, common_1.Controller)('purchase-analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [purchase_analytics_service_1.PurchaseAnalyticsService])
], PurchaseAnalyticsController);
//# sourceMappingURL=purchase-analytics.controller.js.map