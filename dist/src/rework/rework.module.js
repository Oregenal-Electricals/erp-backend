"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReworkModule = void 0;
const common_1 = require("@nestjs/common");
const rework_controller_1 = require("./rework.controller");
const rework_service_1 = require("./rework.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
const settings_module_1 = require("../settings/settings.module");
let ReworkModule = class ReworkModule {
};
exports.ReworkModule = ReworkModule;
exports.ReworkModule = ReworkModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule, settings_module_1.SettingsModule],
        controllers: [rework_controller_1.ReworkController],
        providers: [rework_service_1.ReworkService],
        exports: [rework_service_1.ReworkService],
    })
], ReworkModule);
//# sourceMappingURL=rework.module.js.map