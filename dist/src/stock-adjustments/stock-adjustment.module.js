"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockAdjustmentModule = void 0;
const common_1 = require("@nestjs/common");
const stock_adjustment_controller_1 = require("./stock-adjustment.controller");
const stock_adjustment_service_1 = require("./stock-adjustment.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const stock_ledger_module_1 = require("../stock-ledger/stock-ledger.module");
let StockAdjustmentModule = class StockAdjustmentModule {
};
exports.StockAdjustmentModule = StockAdjustmentModule;
exports.StockAdjustmentModule = StockAdjustmentModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, stock_ledger_module_1.StockLedgerModule],
        controllers: [stock_adjustment_controller_1.StockAdjustmentController],
        providers: [stock_adjustment_service_1.StockAdjustmentService],
        exports: [stock_adjustment_service_1.StockAdjustmentService],
    })
], StockAdjustmentModule);
//# sourceMappingURL=stock-adjustment.module.js.map