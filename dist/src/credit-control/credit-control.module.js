"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditControlModule = void 0;
const common_1 = require("@nestjs/common");
const credit_control_controller_1 = require("./credit-control.controller");
const credit_control_service_1 = require("./credit-control.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let CreditControlModule = class CreditControlModule {
};
exports.CreditControlModule = CreditControlModule;
exports.CreditControlModule = CreditControlModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [credit_control_controller_1.CreditControlController],
        providers: [credit_control_service_1.CreditControlService],
        exports: [credit_control_service_1.CreditControlService],
    })
], CreditControlModule);
//# sourceMappingURL=credit-control.module.js.map