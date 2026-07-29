"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorManagementModule = void 0;
const common_1 = require("@nestjs/common");
const visitor_management_controller_1 = require("./visitor-management.controller");
const visitor_log_controller_1 = require("./visitor-log.controller");
const visitor_management_service_1 = require("./visitor-management.service");
const settings_module_1 = require("../settings/settings.module");
let VisitorManagementModule = class VisitorManagementModule {
};
exports.VisitorManagementModule = VisitorManagementModule;
exports.VisitorManagementModule = VisitorManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [settings_module_1.SettingsModule],
        controllers: [visitor_management_controller_1.VisitorManagementController, visitor_log_controller_1.VisitorLogController],
        providers: [visitor_management_service_1.VisitorManagementService],
        exports: [visitor_management_service_1.VisitorManagementService],
    })
], VisitorManagementModule);
//# sourceMappingURL=visitor-management.module.js.map