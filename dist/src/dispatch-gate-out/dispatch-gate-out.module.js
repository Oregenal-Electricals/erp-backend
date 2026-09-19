"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchGateOutModule = void 0;
const common_1 = require("@nestjs/common");
const dispatch_gate_out_controller_1 = require("./dispatch-gate-out.controller");
const dispatch_gate_out_service_1 = require("./dispatch-gate-out.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const dispatch_document_readiness_module_1 = require("../dispatch-document-readiness/dispatch-document-readiness.module");
const stock_ledger_module_1 = require("../stock-ledger/stock-ledger.module");
let DispatchGateOutModule = class DispatchGateOutModule {
};
exports.DispatchGateOutModule = DispatchGateOutModule;
exports.DispatchGateOutModule = DispatchGateOutModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, dispatch_document_readiness_module_1.DispatchDocumentReadinessModule, stock_ledger_module_1.StockLedgerModule],
        controllers: [dispatch_gate_out_controller_1.DispatchGateOutController],
        providers: [dispatch_gate_out_service_1.DispatchGateOutService],
        exports: [dispatch_gate_out_service_1.DispatchGateOutService],
    })
], DispatchGateOutModule);
//# sourceMappingURL=dispatch-gate-out.module.js.map