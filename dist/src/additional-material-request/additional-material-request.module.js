"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdditionalMaterialRequestModule = void 0;
const common_1 = require("@nestjs/common");
const additional_material_request_controller_1 = require("./additional-material-request.controller");
const additional_material_request_service_1 = require("./additional-material-request.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const workflows_module_1 = require("../workflows/workflows.module");
const work_order_module_1 = require("../work-orders/work-order.module");
let AdditionalMaterialRequestModule = class AdditionalMaterialRequestModule {
};
exports.AdditionalMaterialRequestModule = AdditionalMaterialRequestModule;
exports.AdditionalMaterialRequestModule = AdditionalMaterialRequestModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, workflows_module_1.WorkflowsModule, work_order_module_1.WorkOrderModule],
        controllers: [additional_material_request_controller_1.AdditionalMaterialRequestController],
        providers: [additional_material_request_service_1.AdditionalMaterialRequestService],
        exports: [additional_material_request_service_1.AdditionalMaterialRequestService],
    })
], AdditionalMaterialRequestModule);
//# sourceMappingURL=additional-material-request.module.js.map