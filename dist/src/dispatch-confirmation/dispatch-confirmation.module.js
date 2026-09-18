"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchConfirmationModule = void 0;
const common_1 = require("@nestjs/common");
const dispatch_confirmation_controller_1 = require("./dispatch-confirmation.controller");
const dispatch_confirmation_service_1 = require("./dispatch-confirmation.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const dispatch_document_readiness_module_1 = require("../dispatch-document-readiness/dispatch-document-readiness.module");
let DispatchConfirmationModule = class DispatchConfirmationModule {
};
exports.DispatchConfirmationModule = DispatchConfirmationModule;
exports.DispatchConfirmationModule = DispatchConfirmationModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, dispatch_document_readiness_module_1.DispatchDocumentReadinessModule],
        controllers: [dispatch_confirmation_controller_1.DispatchConfirmationController],
        providers: [dispatch_confirmation_service_1.DispatchConfirmationService],
        exports: [dispatch_confirmation_service_1.DispatchConfirmationService],
    })
], DispatchConfirmationModule);
//# sourceMappingURL=dispatch-confirmation.module.js.map