"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoldStockModule = void 0;
const common_1 = require("@nestjs/common");
const hold_stock_controller_1 = require("./hold-stock.controller");
const hold_stock_service_1 = require("./hold-stock.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const stock_ledger_module_1 = require("../stock-ledger/stock-ledger.module");
const rejected_stock_module_1 = require("../rejected-stock/rejected-stock.module");
let HoldStockModule = class HoldStockModule {
};
exports.HoldStockModule = HoldStockModule;
exports.HoldStockModule = HoldStockModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, stock_ledger_module_1.StockLedgerModule, rejected_stock_module_1.RejectedStockModule],
        controllers: [hold_stock_controller_1.HoldStockController],
        providers: [hold_stock_service_1.HoldStockService],
        exports: [hold_stock_service_1.HoldStockService],
    })
], HoldStockModule);
//# sourceMappingURL=hold-stock.module.js.map