"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSellingPriceModule = void 0;
const common_1 = require("@nestjs/common");
const product_selling_price_controller_1 = require("./product-selling-price.controller");
const product_selling_price_service_1 = require("./product-selling-price.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let ProductSellingPriceModule = class ProductSellingPriceModule {
};
exports.ProductSellingPriceModule = ProductSellingPriceModule;
exports.ProductSellingPriceModule = ProductSellingPriceModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [product_selling_price_controller_1.ProductSellingPriceController],
        providers: [product_selling_price_service_1.ProductSellingPriceService],
        exports: [product_selling_price_service_1.ProductSellingPriceService],
    })
], ProductSellingPriceModule);
//# sourceMappingURL=product-selling-price.module.js.map