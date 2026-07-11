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
exports.HrReportsController = void 0;
const common_1 = require("@nestjs/common");
const hr_reports_service_1 = require("./hr-reports.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let HrReportsController = class HrReportsController {
    constructor(hrReportsService) {
        this.hrReportsService = hrReportsService;
    }
    getHeadcount(req) { return this.hrReportsService.getHeadcountReport(req.user.companyId); }
    getAttendance(month, year, req) {
        return this.hrReportsService.getAttendanceSummaryReport(req.user.companyId, Number(month) || new Date().getMonth() + 1, Number(year) || new Date().getFullYear());
    }
    getLeave(year, req) {
        return this.hrReportsService.getLeaveUtilizationReport(req.user.companyId, Number(year) || new Date().getFullYear());
    }
    getPayroll(month, year, req) {
        return this.hrReportsService.getPayrollCostReport(req.user.companyId, Number(month) || new Date().getMonth() + 1, Number(year) || new Date().getFullYear());
    }
    getAttrition(year, req) {
        return this.hrReportsService.getAttritionReport(req.user.companyId, Number(year) || new Date().getFullYear());
    }
    getOt(month, year, req) {
        return this.hrReportsService.getOtReport(req.user.companyId, Number(month) || new Date().getMonth() + 1, Number(year) || new Date().getFullYear());
    }
};
exports.HrReportsController = HrReportsController;
__decorate([
    (0, common_1.Get)('headcount'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HrReportsController.prototype, "getHeadcount", null);
__decorate([
    (0, common_1.Get)('attendance-summary'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], HrReportsController.prototype, "getAttendance", null);
__decorate([
    (0, common_1.Get)('leave-utilization'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HrReportsController.prototype, "getLeave", null);
__decorate([
    (0, common_1.Get)('payroll-cost'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], HrReportsController.prototype, "getPayroll", null);
__decorate([
    (0, common_1.Get)('attrition'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HrReportsController.prototype, "getAttrition", null);
__decorate([
    (0, common_1.Get)('ot-report'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.HR_VIEW),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], HrReportsController.prototype, "getOt", null);
exports.HrReportsController = HrReportsController = __decorate([
    (0, common_1.Controller)('hr-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [hr_reports_service_1.HrReportsService])
], HrReportsController);
//# sourceMappingURL=hr-reports.controller.js.map