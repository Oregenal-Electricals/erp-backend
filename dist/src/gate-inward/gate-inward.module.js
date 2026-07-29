"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GateInwardModule = void 0;
const common_1 = require("@nestjs/common");
const gate_inward_controller_1 = require("./gate-inward.controller");
const gate_inward_service_1 = require("./gate-inward.service");
const settings_module_1 = require("../settings/settings.module");
let GateInwardModule = class GateInwardModule {
};
exports.GateInwardModule = GateInwardModule;
exports.GateInwardModule = GateInwardModule = __decorate([
    (0, common_1.Module)({
        imports: [settings_module_1.SettingsModule],
        controllers: [gate_inward_controller_1.GateInwardController],
        providers: [gate_inward_service_1.GateInwardService],
        exports: [gate_inward_service_1.GateInwardService],
    })
], GateInwardModule);
//# sourceMappingURL=gate-inward.module.js.map