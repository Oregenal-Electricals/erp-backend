"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchReservationModule = void 0;
const common_1 = require("@nestjs/common");
const dispatch_reservation_controller_1 = require("./dispatch-reservation.controller");
const dispatch_reservation_service_1 = require("./dispatch-reservation.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let DispatchReservationModule = class DispatchReservationModule {
};
exports.DispatchReservationModule = DispatchReservationModule;
exports.DispatchReservationModule = DispatchReservationModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [dispatch_reservation_controller_1.DispatchReservationController],
        providers: [dispatch_reservation_service_1.DispatchReservationService],
        exports: [dispatch_reservation_service_1.DispatchReservationService],
    })
], DispatchReservationModule);
//# sourceMappingURL=dispatch-reservation.module.js.map