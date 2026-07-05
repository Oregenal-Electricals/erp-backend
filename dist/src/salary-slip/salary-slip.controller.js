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
exports.SalarySlipController = void 0;
const common_1 = require("@nestjs/common");
const salary_slip_service_1 = require("./salary-slip.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let SalarySlipController = class SalarySlipController {
    constructor(slipService) {
        this.slipService = slipService;
    }
    getHistory(empId, req) {
        return this.slipService.getSlipHistory(req.user.companyId, empId);
    }
    async downloadSlip(empId, month, year, req, res) {
        const pdf = await this.slipService.generateSlip(empId, Number(month), Number(year), req.user.companyId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="salary-slip-${empId}-${month}-${year}.pdf"`);
        res.send(pdf);
    }
    async downloadBulk(runId, req, res) {
        const pdf = await this.slipService.generateBulkSlips(runId, req.user.companyId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="salary-slips-${runId}.pdf"`);
        res.send(pdf);
    }
};
exports.SalarySlipController = SalarySlipController;
__decorate([
    (0, common_1.Get)('history/:employeeId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalarySlipController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('download/:employeeId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __param(3, (0, common_1.Request)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SalarySlipController.prototype, "downloadSlip", null);
__decorate([
    (0, common_1.Get)('bulk/:payrollRunId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('payrollRunId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SalarySlipController.prototype, "downloadBulk", null);
exports.SalarySlipController = SalarySlipController = __decorate([
    (0, common_1.Controller)('salary-slip'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [salary_slip_service_1.SalarySlipService])
], SalarySlipController);
//# sourceMappingURL=salary-slip.controller.js.map