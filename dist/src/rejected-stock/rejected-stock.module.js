"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RejectedStockModule = void 0;
const common_1 = require("@nestjs/common");
const rejected_stock_controller_1 = require("./rejected-stock.controller");
const rejected_stock_service_1 = require("./rejected-stock.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let RejectedStockModule = class RejectedStockModule {
};
exports.RejectedStockModule = RejectedStockModule;
exports.RejectedStockModule = RejectedStockModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [rejected_stock_controller_1.RejectedStockController],
        providers: [rejected_stock_service_1.RejectedStockService],
        exports: [rejected_stock_service_1.RejectedStockService],
    })
], RejectedStockModule);
//# sourceMappingURL=rejected-stock.module.js.map