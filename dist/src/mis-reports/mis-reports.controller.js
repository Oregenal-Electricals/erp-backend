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
exports.MisReportsController = void 0;
const common_1 = require("@nestjs/common");
const mis_reports_service_1 = require("./mis-reports.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let MisReportsController = class MisReportsController {
    constructor(misService) {
        this.misService = misService;
    }
    getSalesSummary(req, query) { return this.misService.getSalesSummary(req.user.companyId, query); }
    getPurchaseSummary(req, query) { return this.misService.getPurchaseSummary(req.user.companyId, query); }
    getStockPosition(req, query) { return this.misService.getStockPosition(req.user.companyId, query); }
    getOutstandingAr(req, query) { return this.misService.getOutstandingAr(req.user.companyId, query); }
    getOutstandingAp(req, query) { return this.misService.getOutstandingAp(req.user.companyId, query); }
    getNcrSummary(req, query) { return this.misService.getNcrSummary(req.user.companyId, query); }
    getProductionSummary(req, query) { return this.misService.getProductionSummary(req.user.companyId, query); }
    getGstSummary(req, query) { return this.misService.getGstSummary(req.user.companyId, query); }
};
exports.MisReportsController = MisReportsController;
__decorate([
    (0, common_1.Get)('sales-summary'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MIS_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MisReportsController.prototype, "getSalesSummary", null);
__decorate([
    (0, common_1.Get)('purchase-summary'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MIS_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MisReportsController.prototype, "getPurchaseSummary", null);
__decorate([
    (0, common_1.Get)('stock-position'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MIS_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MisReportsController.prototype, "getStockPosition", null);
__decorate([
    (0, common_1.Get)('outstanding-ar'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MIS_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MisReportsController.prototype, "getOutstandingAr", null);
__decorate([
    (0, common_1.Get)('outstanding-ap'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MIS_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MisReportsController.prototype, "getOutstandingAp", null);
__decorate([
    (0, common_1.Get)('ncr-summary'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MIS_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MisReportsController.prototype, "getNcrSummary", null);
__decorate([
    (0, common_1.Get)('production-summary'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MIS_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MisReportsController.prototype, "getProductionSummary", null);
__decorate([
    (0, common_1.Get)('gst-summary'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MIS_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MisReportsController.prototype, "getGstSummary", null);
exports.MisReportsController = MisReportsController = __decorate([
    (0, common_1.Controller)('mis-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [mis_reports_service_1.MisReportsService])
], MisReportsController);
//# sourceMappingURL=mis-reports.controller.js.map