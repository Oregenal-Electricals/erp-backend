"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockLocationTransferModule = void 0;
const common_1 = require("@nestjs/common");
const stock_location_transfer_controller_1 = require("./stock-location-transfer.controller");
const stock_location_transfer_service_1 = require("./stock-location-transfer.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const stock_location_balance_module_1 = require("../stock-location-balance/stock-location-balance.module");
let StockLocationTransferModule = class StockLocationTransferModule {
};
exports.StockLocationTransferModule = StockLocationTransferModule;
exports.StockLocationTransferModule = StockLocationTransferModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, stock_location_balance_module_1.StockLocationBalanceModule],
        controllers: [stock_location_transfer_controller_1.StockLocationTransferController],
        providers: [stock_location_transfer_service_1.StockLocationTransferService],
        exports: [stock_location_transfer_service_1.StockLocationTransferService],
    })
], StockLocationTransferModule);
//# sourceMappingURL=stock-location-transfer.module.js.map