"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GateOutwardModule = void 0;
const common_1 = require("@nestjs/common");
const gate_outward_controller_1 = require("./gate-outward.controller");
const gate_outward_service_1 = require("./gate-outward.service");
const settings_module_1 = require("../settings/settings.module");
let GateOutwardModule = class GateOutwardModule {
};
exports.GateOutwardModule = GateOutwardModule;
exports.GateOutwardModule = GateOutwardModule = __decorate([
    (0, common_1.Module)({
        imports: [settings_module_1.SettingsModule],
        controllers: [gate_outward_controller_1.GateOutwardController],
        providers: [gate_outward_service_1.GateOutwardService],
        exports: [gate_outward_service_1.GateOutwardService],
    })
], GateOutwardModule);
//# sourceMappingURL=gate-outward.module.js.map