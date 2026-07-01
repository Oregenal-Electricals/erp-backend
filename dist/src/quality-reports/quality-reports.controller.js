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
exports.QualityReportsController = void 0;
const common_1 = require("@nestjs/common");
const quality_reports_service_1 = require("./quality-reports.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let QualityReportsController = class QualityReportsController {
    constructor(qrService) {
        this.qrService = qrService;
    }
    getNcrReport(req, query) { return this.qrService.getNcrReport(req.user, query); }
    getCapaReport(req, query) { return this.qrService.getCapaReport(req.user, query); }
    getOqcReport(req, query) { return this.qrService.getOqcReport(req.user, query); }
    getSupplierReport(req, query) { return this.qrService.getSupplierReport(req.user, query); }
    getComplaintReport(req, query) { return this.qrService.getComplaintReport(req.user, query); }
    getKpiSummary(req) { return this.qrService.getKpiSummary(req.user); }
};
exports.QualityReportsController = QualityReportsController;
__decorate([
    (0, common_1.Get)('ncr-report'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QualityReportsController.prototype, "getNcrReport", null);
__decorate([
    (0, common_1.Get)('capa-report'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QualityReportsController.prototype, "getCapaReport", null);
__decorate([
    (0, common_1.Get)('oqc-report'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QualityReportsController.prototype, "getOqcReport", null);
__decorate([
    (0, common_1.Get)('supplier-report'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QualityReportsController.prototype, "getSupplierReport", null);
__decorate([
    (0, common_1.Get)('complaint-report'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QualityReportsController.prototype, "getComplaintReport", null);
__decorate([
    (0, common_1.Get)('kpi-summary'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QualityReportsController.prototype, "getKpiSummary", null);
exports.QualityReportsController = QualityReportsController = __decorate([
    (0, common_1.Controller)('quality-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [quality_reports_service_1.QualityReportsService])
], QualityReportsController);
//# sourceMappingURL=quality-reports.controller.js.map