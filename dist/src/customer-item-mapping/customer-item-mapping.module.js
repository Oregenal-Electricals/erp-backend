"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerItemMappingModule = void 0;
const common_1 = require("@nestjs/common");
const customer_item_mapping_controller_1 = require("./customer-item-mapping.controller");
const customer_item_mapping_service_1 = require("./customer-item-mapping.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const workflows_module_1 = require("../workflows/workflows.module");
let CustomerItemMappingModule = class CustomerItemMappingModule {
};
exports.CustomerItemMappingModule = CustomerItemMappingModule;
exports.CustomerItemMappingModule = CustomerItemMappingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, (0, common_1.forwardRef)(() => workflows_module_1.WorkflowsModule)],
        controllers: [customer_item_mapping_controller_1.CustomerItemMappingController],
        providers: [customer_item_mapping_service_1.CustomerItemMappingService],
        exports: [customer_item_mapping_service_1.CustomerItemMappingService],
    })
], CustomerItemMappingModule);
//# sourceMappingURL=customer-item-mapping.module.js.map