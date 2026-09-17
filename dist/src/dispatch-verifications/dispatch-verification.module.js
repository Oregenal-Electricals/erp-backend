"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchVerificationModule = void 0;
const common_1 = require("@nestjs/common");
const dispatch_verification_controller_1 = require("./dispatch-verification.controller");
const dispatch_verification_service_1 = require("./dispatch-verification.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let DispatchVerificationModule = class DispatchVerificationModule {
};
exports.DispatchVerificationModule = DispatchVerificationModule;
exports.DispatchVerificationModule = DispatchVerificationModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [dispatch_verification_controller_1.DispatchVerificationController],
        providers: [dispatch_verification_service_1.DispatchVerificationService],
        exports: [dispatch_verification_service_1.DispatchVerificationService],
    })
], DispatchVerificationModule);
//# sourceMappingURL=dispatch-verification.module.js.map