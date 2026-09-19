"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchReconciliationModule = void 0;
const common_1 = require("@nestjs/common");
const dispatch_reconciliation_controller_1 = require("./dispatch-reconciliation.controller");
const dispatch_reconciliation_service_1 = require("./dispatch-reconciliation.service");
const dispatch_trace_service_1 = require("./dispatch-trace.service");
const dispatch_dashboard_service_1 = require("./dispatch-dashboard.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let DispatchReconciliationModule = class DispatchReconciliationModule {
};
exports.DispatchReconciliationModule = DispatchReconciliationModule;
exports.DispatchReconciliationModule = DispatchReconciliationModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [dispatch_reconciliation_controller_1.DispatchReconciliationController],
        providers: [dispatch_reconciliation_service_1.DispatchReconciliationService, dispatch_trace_service_1.DispatchTraceService, dispatch_dashboard_service_1.DispatchDashboardService],
        exports: [dispatch_reconciliation_service_1.DispatchReconciliationService, dispatch_trace_service_1.DispatchTraceService, dispatch_dashboard_service_1.DispatchDashboardService],
    })
], DispatchReconciliationModule);
//# sourceMappingURL=dispatch-reconciliation.module.js.map