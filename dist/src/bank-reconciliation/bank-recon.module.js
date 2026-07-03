"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankReconModule = void 0;
const common_1 = require("@nestjs/common");
const bank_recon_controller_1 = require("./bank-recon.controller");
const bank_recon_service_1 = require("./bank-recon.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let BankReconModule = class BankReconModule {
};
exports.BankReconModule = BankReconModule;
exports.BankReconModule = BankReconModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [bank_recon_controller_1.BankReconController],
        providers: [bank_recon_service_1.BankReconService],
        exports: [bank_recon_service_1.BankReconService],
    })
], BankReconModule);
//# sourceMappingURL=bank-recon.module.js.map