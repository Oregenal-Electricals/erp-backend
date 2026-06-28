"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionIssueModule = void 0;
const common_1 = require("@nestjs/common");
const production_issue_controller_1 = require("./production-issue.controller");
const production_issue_service_1 = require("./production-issue.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const stock_ledger_module_1 = require("../stock-ledger/stock-ledger.module");
const mrp_module_1 = require("../mrp/mrp.module");
let ProductionIssueModule = class ProductionIssueModule {
};
exports.ProductionIssueModule = ProductionIssueModule;
exports.ProductionIssueModule = ProductionIssueModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, stock_ledger_module_1.StockLedgerModule, mrp_module_1.MrpModule],
        controllers: [production_issue_controller_1.ProductionIssueController],
        providers: [production_issue_service_1.ProductionIssueService],
        exports: [production_issue_service_1.ProductionIssueService],
    })
], ProductionIssueModule);
//# sourceMappingURL=production-issue.module.js.map