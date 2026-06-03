"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const change_requests_controller_1 = require("./change-requests.controller");
const change_requests_service_1 = require("./change-requests.service");
const settings_module_1 = require("../settings/settings.module");
let ChangeRequestsModule = class ChangeRequestsModule {
};
exports.ChangeRequestsModule = ChangeRequestsModule;
exports.ChangeRequestsModule = ChangeRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [settings_module_1.SettingsModule],
        controllers: [change_requests_controller_1.ChangeRequestsController],
        providers: [change_requests_service_1.ChangeRequestsService],
        exports: [change_requests_service_1.ChangeRequestsService],
    })
], ChangeRequestsModule);
//# sourceMappingURL=change-requests.module.js.map