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
exports.ExcelExportController = void 0;
const common_1 = require("@nestjs/common");
const excel_export_service_1 = require("./excel-export.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let ExcelExportController = class ExcelExportController {
    constructor(excelService) {
        this.excelService = excelService;
    }
    send(res, buffer, filename) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async arInvoices(req, query, res) {
        const buffer = await this.excelService.exportArInvoices(req.user.companyId, query);
        this.send(res, buffer, `AR-Invoices-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    async apBills(req, query, res) {
        const buffer = await this.excelService.exportApBills(req.user.companyId, query);
        this.send(res, buffer, `AP-Bills-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    async purchaseOrders(req, query, res) {
        const buffer = await this.excelService.exportPurchaseOrders(req.user.companyId, query);
        this.send(res, buffer, `Purchase-Orders-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    async salesOrders(req, query, res) {
        const buffer = await this.excelService.exportSalesOrders(req.user.companyId, query);
        this.send(res, buffer, `Sales-Orders-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    async stock(req, res) {
        const buffer = await this.excelService.exportStock(req.user.companyId);
        this.send(res, buffer, `Stock-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    async ncr(req, query, res) {
        const buffer = await this.excelService.exportNcr(req.user.companyId, query);
        this.send(res, buffer, `NCR-Register-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    async tasks(req, query, res) {
        const buffer = await this.excelService.exportTasks(req.user.companyId, query);
        this.send(res, buffer, `Tasks-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    async trialBalance(req, query, res) {
        const buffer = await this.excelService.exportTrialBalance(req.user.companyId, query);
        this.send(res, buffer, `Trial-Balance-${query.period || 'current'}.xlsx`);
    }
};
exports.ExcelExportController = ExcelExportController;
__decorate([
    (0, common_1.Get)('ar-invoices'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcelExportController.prototype, "arInvoices", null);
__decorate([
    (0, common_1.Get)('ap-bills'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcelExportController.prototype, "apBills", null);
__decorate([
    (0, common_1.Get)('purchase-orders'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcelExportController.prototype, "purchaseOrders", null);
__decorate([
    (0, common_1.Get)('sales-orders'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcelExportController.prototype, "salesOrders", null);
__decorate([
    (0, common_1.Get)('stock'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ExcelExportController.prototype, "stock", null);
__decorate([
    (0, common_1.Get)('ncr'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcelExportController.prototype, "ncr", null);
__decorate([
    (0, common_1.Get)('tasks'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcelExportController.prototype, "tasks", null);
__decorate([
    (0, common_1.Get)('trial-balance'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcelExportController.prototype, "trialBalance", null);
exports.ExcelExportController = ExcelExportController = __decorate([
    (0, common_1.Controller)('excel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [excel_export_service_1.ExcelExportService])
], ExcelExportController);
//# sourceMappingURL=excel-export.controller.js.map