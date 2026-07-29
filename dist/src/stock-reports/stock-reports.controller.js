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
exports.StockReportsController = void 0;
const common_1 = require("@nestjs/common");
const stock_reports_service_1 = require("./stock-reports.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let StockReportsController = class StockReportsController {
    constructor(srService) {
        this.srService = srService;
    }
    getLedger(req, query) { return this.srService.getLedger(req.user, query); }
    getBalanceSummary(req, query) { return this.srService.getBalanceSummary(req.user, query); }
    getItemCard(itemCode, req, query) { return this.srService.getItemCard(itemCode, req.user, query); }
    getBatchMovements(req, query) { return this.srService.getBatchMovements(req.user, query); }
    getConsumption(req, query) { return this.srService.getConsumptionReport(req.user, query); }
};
exports.StockReportsController = StockReportsController;
__decorate([
    (0, common_1.Get)('ledger'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STOCK_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StockReportsController.prototype, "getLedger", null);
__decorate([
    (0, common_1.Get)('balance-summary'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STOCK_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StockReportsController.prototype, "getBalanceSummary", null);
__decorate([
    (0, common_1.Get)('item-card/:itemCode'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STOCK_REPORT_VIEW),
    __param(0, (0, common_1.Param)('itemCode')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], StockReportsController.prototype, "getItemCard", null);
__decorate([
    (0, common_1.Get)('batch-movements'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STOCK_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StockReportsController.prototype, "getBatchMovements", null);
__decorate([
    (0, common_1.Get)('consumption'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STOCK_REPORT_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StockReportsController.prototype, "getConsumption", null);
exports.StockReportsController = StockReportsController = __decorate([
    (0, common_1.Controller)('stock-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [stock_reports_service_1.StockReportsService])
], StockReportsController);
//# sourceMappingURL=stock-reports.controller.js.map