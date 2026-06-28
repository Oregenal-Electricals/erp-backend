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
exports.InventoryReportsController = void 0;
const common_1 = require("@nestjs/common");
const inventory_reports_service_1 = require("./inventory-reports.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let InventoryReportsController = class InventoryReportsController {
    constructor(irService) {
        this.irService = irService;
    }
    getStockRegister(req, query) { return this.irService.getStockRegister(req.user, query); }
    getGrnRegister(req, query) { return this.irService.getGrnRegister(req.user, query); }
    getIssueRegister(req, query) { return this.irService.getIssueRegister(req.user, query); }
    getTransferRegister(req, query) { return this.irService.getTransferRegister(req.user, query); }
    getAbcAnalysis(req, query) { return this.irService.getAbcAnalysis(req.user, query); }
};
exports.InventoryReportsController = InventoryReportsController;
__decorate([
    (0, common_1.Get)('stock-register'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryReportsController.prototype, "getStockRegister", null);
__decorate([
    (0, common_1.Get)('grn-register'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryReportsController.prototype, "getGrnRegister", null);
__decorate([
    (0, common_1.Get)('issue-register'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryReportsController.prototype, "getIssueRegister", null);
__decorate([
    (0, common_1.Get)('transfer-register'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryReportsController.prototype, "getTransferRegister", null);
__decorate([
    (0, common_1.Get)('abc-analysis'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryReportsController.prototype, "getAbcAnalysis", null);
exports.InventoryReportsController = InventoryReportsController = __decorate([
    (0, common_1.Controller)('inventory-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [inventory_reports_service_1.InventoryReportsService])
], InventoryReportsController);
//# sourceMappingURL=inventory-reports.controller.js.map