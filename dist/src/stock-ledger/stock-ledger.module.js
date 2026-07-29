"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockLedgerModule = void 0;
const common_1 = require("@nestjs/common");
const stock_ledger_controller_1 = require("./stock-ledger.controller");
const stock_ledger_service_1 = require("./stock-ledger.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const customer_po_module_1 = require("../customer-po/customer-po.module");
let StockLedgerModule = class StockLedgerModule {
};
exports.StockLedgerModule = StockLedgerModule;
exports.StockLedgerModule = StockLedgerModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, customer_po_module_1.CustomerPoModule],
        controllers: [stock_ledger_controller_1.StockLedgerController],
        providers: [stock_ledger_service_1.StockLedgerService],
        exports: [stock_ledger_service_1.StockLedgerService],
    })
], StockLedgerModule);
//# sourceMappingURL=stock-ledger.module.js.map