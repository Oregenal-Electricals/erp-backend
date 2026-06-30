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
exports.ProductionReportsController = void 0;
const common_1 = require("@nestjs/common");
const production_reports_service_1 = require("./production-reports.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let ProductionReportsController = class ProductionReportsController {
    constructor(prService) {
        this.prService = prService;
    }
    getWoCompletion(req, query) { return this.prService.getWoCompletionReport(req.user, query); }
    getShiftProduction(req, query) { return this.prService.getShiftProductionReport(req.user, query); }
    getMaterialConsumption(req, query) { return this.prService.getMaterialConsumptionReport(req.user, query); }
    getScrapAnalysis(req, query) { return this.prService.getScrapAnalysis(req.user, query); }
    getQualitySummary(req, query) { return this.prService.getQualitySummary(req.user, query); }
};
exports.ProductionReportsController = ProductionReportsController;
__decorate([
    (0, common_1.Get)('wo-completion'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductionReportsController.prototype, "getWoCompletion", null);
__decorate([
    (0, common_1.Get)('shift-production'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductionReportsController.prototype, "getShiftProduction", null);
__decorate([
    (0, common_1.Get)('material-consumption'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductionReportsController.prototype, "getMaterialConsumption", null);
__decorate([
    (0, common_1.Get)('scrap-analysis'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductionReportsController.prototype, "getScrapAnalysis", null);
__decorate([
    (0, common_1.Get)('quality-summary'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductionReportsController.prototype, "getQualitySummary", null);
exports.ProductionReportsController = ProductionReportsController = __decorate([
    (0, common_1.Controller)('production-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [production_reports_service_1.ProductionReportsService])
], ProductionReportsController);
//# sourceMappingURL=production-reports.controller.js.map