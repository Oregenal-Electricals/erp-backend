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
exports.FinancialReportsController = void 0;
const common_1 = require("@nestjs/common");
const financial_reports_service_1 = require("./financial-reports.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let FinancialReportsController = class FinancialReportsController {
    constructor(frService) {
        this.frService = frService;
    }
    getSummary(req) { return this.frService.getSummary(req.user); }
    getTrialBalance(req, query) { return this.frService.getTrialBalance(req.user, query); }
    getProfitAndLoss(req, query) { return this.frService.getProfitAndLoss(req.user, query); }
    getBalanceSheet(req, query) { return this.frService.getBalanceSheet(req.user, query); }
    getCashFlow(req, query) { return this.frService.getCashFlow(req.user, query); }
};
exports.FinancialReportsController = FinancialReportsController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinancialReportsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('trial-balance'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinancialReportsController.prototype, "getTrialBalance", null);
__decorate([
    (0, common_1.Get)('profit-and-loss'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinancialReportsController.prototype, "getProfitAndLoss", null);
__decorate([
    (0, common_1.Get)('balance-sheet'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinancialReportsController.prototype, "getBalanceSheet", null);
__decorate([
    (0, common_1.Get)('cash-flow'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.FINANCE_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinancialReportsController.prototype, "getCashFlow", null);
exports.FinancialReportsController = FinancialReportsController = __decorate([
    (0, common_1.Controller)('financial-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [financial_reports_service_1.FinancialReportsService])
], FinancialReportsController);
//# sourceMappingURL=financial-reports.controller.js.map