"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManpowerModule = void 0;
const common_1 = require("@nestjs/common");
const manpower_controller_1 = require("./manpower.controller");
const manpower_service_1 = require("./manpower.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const workflows_module_1 = require("../workflows/workflows.module");
const notifications_module_1 = require("../notifications/notifications.module");
const settings_module_1 = require("../settings/settings.module");
let ManpowerModule = class ManpowerModule {
};
exports.ManpowerModule = ManpowerModule;
exports.ManpowerModule = ManpowerModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, workflows_module_1.WorkflowsModule, notifications_module_1.NotificationsModule, settings_module_1.SettingsModule],
        controllers: [manpower_controller_1.ManpowerController],
        providers: [manpower_service_1.ManpowerService],
        exports: [manpower_service_1.ManpowerService],
    })
], ManpowerModule);
//# sourceMappingURL=manpower.module.js.map