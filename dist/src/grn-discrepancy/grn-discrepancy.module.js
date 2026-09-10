"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrnDiscrepancyModule = void 0;
const common_1 = require("@nestjs/common");
const grn_discrepancy_controller_1 = require("./grn-discrepancy.controller");
const grn_discrepancy_service_1 = require("./grn-discrepancy.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const notifications_module_1 = require("../notifications/notifications.module");
let GrnDiscrepancyModule = class GrnDiscrepancyModule {
};
exports.GrnDiscrepancyModule = GrnDiscrepancyModule;
exports.GrnDiscrepancyModule = GrnDiscrepancyModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, notifications_module_1.NotificationsModule],
        controllers: [grn_discrepancy_controller_1.GrnDiscrepancyController],
        providers: [grn_discrepancy_service_1.GrnDiscrepancyService],
        exports: [grn_discrepancy_service_1.GrnDiscrepancyService],
    })
], GrnDiscrepancyModule);
//# sourceMappingURL=grn-discrepancy.module.js.map