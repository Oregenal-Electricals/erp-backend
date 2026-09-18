"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchDocumentReadinessModule = void 0;
const common_1 = require("@nestjs/common");
const dispatch_document_readiness_controller_1 = require("./dispatch-document-readiness.controller");
const dispatch_document_readiness_service_1 = require("./dispatch-document-readiness.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let DispatchDocumentReadinessModule = class DispatchDocumentReadinessModule {
};
exports.DispatchDocumentReadinessModule = DispatchDocumentReadinessModule;
exports.DispatchDocumentReadinessModule = DispatchDocumentReadinessModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [dispatch_document_readiness_controller_1.DispatchDocumentReadinessController],
        providers: [dispatch_document_readiness_service_1.DispatchDocumentReadinessService],
        exports: [dispatch_document_readiness_service_1.DispatchDocumentReadinessService],
    })
], DispatchDocumentReadinessModule);
//# sourceMappingURL=dispatch-document-readiness.module.js.map