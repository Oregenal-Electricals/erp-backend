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
exports.DispatchReconciliationController = void 0;
const common_1 = require("@nestjs/common");
const dispatch_reconciliation_service_1 = require("./dispatch-reconciliation.service");
const dispatch_trace_service_1 = require("./dispatch-trace.service");
const dispatch_dashboard_service_1 = require("./dispatch-dashboard.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let DispatchReconciliationController = class DispatchReconciliationController {
    constructor(reconciliation, traceService, dashboard) {
        this.reconciliation = reconciliation;
        this.traceService = traceService;
        this.dashboard = dashboard;
    }
    getDashboard(req) {
        return this.dashboard.getDashboard(req.user);
    }
    reconcilePlan(planId, req) {
        return this.reconciliation.reconcilePlan(planId, req.user);
    }
    reconcileSalesOrder(soId, req) {
        return this.reconciliation.reconcileSalesOrder(soId, req.user);
    }
    reconcileSfgStage(workOrderId, req) {
        return this.reconciliation.reconcileSfgStage(workOrderId, req.user);
    }
    checkConsistency(gateOutId, req) {
        return this.reconciliation.checkCriticalConsistency(gateOutId, req.user);
    }
    trace(packageNumber, gateOutNumber, soNumber, req) {
        return this.traceService.trace({ packageNumber, gateOutNumber, soNumber }, req.user);
    }
};
exports.DispatchReconciliationController = DispatchReconciliationController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_DASHBOARD_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DispatchReconciliationController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('plan/:planId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_RECONCILIATION_VIEW),
    __param(0, (0, common_1.Param)('planId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchReconciliationController.prototype, "reconcilePlan", null);
__decorate([
    (0, common_1.Get)('sales-order/:soId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_RECONCILIATION_VIEW),
    __param(0, (0, common_1.Param)('soId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchReconciliationController.prototype, "reconcileSalesOrder", null);
__decorate([
    (0, common_1.Get)('sfg-stage/:workOrderId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_RECONCILIATION_VIEW),
    __param(0, (0, common_1.Param)('workOrderId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchReconciliationController.prototype, "reconcileSfgStage", null);
__decorate([
    (0, common_1.Get)('gate-out/:gateOutId/consistency'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_RECONCILIATION_RUN),
    __param(0, (0, common_1.Param)('gateOutId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchReconciliationController.prototype, "checkConsistency", null);
__decorate([
    (0, common_1.Get)('trace'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_TRACE_VIEW),
    __param(0, (0, common_1.Query)('packageNumber')),
    __param(1, (0, common_1.Query)('gateOutNumber')),
    __param(2, (0, common_1.Query)('soNumber')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], DispatchReconciliationController.prototype, "trace", null);
exports.DispatchReconciliationController = DispatchReconciliationController = __decorate([
    (0, common_1.Controller)('dispatch-reconciliation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [dispatch_reconciliation_service_1.DispatchReconciliationService,
        dispatch_trace_service_1.DispatchTraceService,
        dispatch_dashboard_service_1.DispatchDashboardService])
], DispatchReconciliationController);
//# sourceMappingURL=dispatch-reconciliation.controller.js.map