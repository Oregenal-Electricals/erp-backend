"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoApprovalModule = void 0;
const common_1 = require("@nestjs/common");
const po_approval_controller_1 = require("./po-approval.controller");
const po_approval_service_1 = require("./po-approval.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let PoApprovalModule = class PoApprovalModule {
};
exports.PoApprovalModule = PoApprovalModule;
exports.PoApprovalModule = PoApprovalModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [po_approval_controller_1.PoApprovalController],
        providers: [po_approval_service_1.PoApprovalService],
        exports: [po_approval_service_1.PoApprovalService],
    })
], PoApprovalModule);
//# sourceMappingURL=po-approval.module.js.map