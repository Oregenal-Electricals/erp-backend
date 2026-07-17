"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderModule = void 0;
const common_1 = require("@nestjs/common");
const work_order_controller_1 = require("./work-order.controller");
const work_order_service_1 = require("./work-order.service");
const material_reservation_service_1 = require("./material-reservation.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let WorkOrderModule = class WorkOrderModule {
};
exports.WorkOrderModule = WorkOrderModule;
exports.WorkOrderModule = WorkOrderModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [work_order_controller_1.WorkOrderController],
        providers: [work_order_service_1.WorkOrderService, material_reservation_service_1.MaterialReservationService],
        exports: [work_order_service_1.WorkOrderService, material_reservation_service_1.MaterialReservationService],
    })
], WorkOrderModule);
//# sourceMappingURL=work-order.module.js.map