"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialIssueOverrideModule = void 0;
const common_1 = require("@nestjs/common");
const material_issue_override_controller_1 = require("./material-issue-override.controller");
const material_issue_override_service_1 = require("./material-issue-override.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const workflows_module_1 = require("../workflows/workflows.module");
const production_material_return_module_1 = require("../production-material-return/production-material-return.module");
let MaterialIssueOverrideModule = class MaterialIssueOverrideModule {
};
exports.MaterialIssueOverrideModule = MaterialIssueOverrideModule;
exports.MaterialIssueOverrideModule = MaterialIssueOverrideModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, workflows_module_1.WorkflowsModule, production_material_return_module_1.ProductionMaterialReturnModule],
        controllers: [material_issue_override_controller_1.MaterialIssueOverrideController],
        providers: [material_issue_override_service_1.MaterialIssueOverrideService],
        exports: [material_issue_override_service_1.MaterialIssueOverrideService],
    })
], MaterialIssueOverrideModule);
//# sourceMappingURL=material-issue-override.module.js.map