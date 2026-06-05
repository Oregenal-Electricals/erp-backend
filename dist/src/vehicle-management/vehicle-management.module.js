"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleManagementModule = void 0;
const common_1 = require("@nestjs/common");
const vehicle_management_controller_1 = require("./vehicle-management.controller");
const vehicle_log_controller_1 = require("./vehicle-log.controller");
const vehicle_management_service_1 = require("./vehicle-management.service");
const settings_module_1 = require("../settings/settings.module");
let VehicleManagementModule = class VehicleManagementModule {
};
exports.VehicleManagementModule = VehicleManagementModule;
exports.VehicleManagementModule = VehicleManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [settings_module_1.SettingsModule],
        controllers: [vehicle_management_controller_1.VehicleManagementController, vehicle_log_controller_1.VehicleLogController],
        providers: [vehicle_management_service_1.VehicleManagementService],
        exports: [vehicle_management_service_1.VehicleManagementService],
    })
], VehicleManagementModule);
//# sourceMappingURL=vehicle-management.module.js.map