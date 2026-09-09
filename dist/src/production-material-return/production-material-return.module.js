"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionMaterialReturnModule = void 0;
const common_1 = require("@nestjs/common");
const production_material_return_controller_1 = require("./production-material-return.controller");
const production_material_return_service_1 = require("./production-material-return.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const stock_ledger_module_1 = require("../stock-ledger/stock-ledger.module");
let ProductionMaterialReturnModule = class ProductionMaterialReturnModule {
};
exports.ProductionMaterialReturnModule = ProductionMaterialReturnModule;
exports.ProductionMaterialReturnModule = ProductionMaterialReturnModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, stock_ledger_module_1.StockLedgerModule],
        controllers: [production_material_return_controller_1.ProductionMaterialReturnController],
        providers: [production_material_return_service_1.ProductionMaterialReturnService],
        exports: [production_material_return_service_1.ProductionMaterialReturnService],
    })
], ProductionMaterialReturnModule);
//# sourceMappingURL=production-material-return.module.js.map