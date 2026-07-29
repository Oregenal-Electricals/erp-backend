"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseRequisitionModule = void 0;
const common_1 = require("@nestjs/common");
const purchase_requisition_controller_1 = require("./purchase-requisition.controller");
const purchase_requisition_service_1 = require("./purchase-requisition.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let PurchaseRequisitionModule = class PurchaseRequisitionModule {
};
exports.PurchaseRequisitionModule = PurchaseRequisitionModule;
exports.PurchaseRequisitionModule = PurchaseRequisitionModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [purchase_requisition_controller_1.PurchaseRequisitionController],
        providers: [purchase_requisition_service_1.PurchaseRequisitionService],
        exports: [purchase_requisition_service_1.PurchaseRequisitionService],
    })
], PurchaseRequisitionModule);
//# sourceMappingURL=purchase-requisition.module.js.map