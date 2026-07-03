"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfEngineModule = void 0;
const common_1 = require("@nestjs/common");
const pdf_engine_controller_1 = require("./pdf-engine.controller");
const pdf_engine_service_1 = require("./pdf-engine.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let PdfEngineModule = class PdfEngineModule {
};
exports.PdfEngineModule = PdfEngineModule;
exports.PdfEngineModule = PdfEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [pdf_engine_controller_1.PdfEngineController],
        providers: [pdf_engine_service_1.PdfEngineService],
        exports: [pdf_engine_service_1.PdfEngineService],
    })
], PdfEngineModule);
//# sourceMappingURL=pdf-engine.module.js.map