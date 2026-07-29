"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RackBinModule = void 0;
const common_1 = require("@nestjs/common");
const rack_bin_controller_1 = require("./rack-bin.controller");
const rack_bin_service_1 = require("./rack-bin.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let RackBinModule = class RackBinModule {
};
exports.RackBinModule = RackBinModule;
exports.RackBinModule = RackBinModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [rack_bin_controller_1.RackBinController],
        providers: [rack_bin_service_1.RackBinService],
        exports: [rack_bin_service_1.RackBinService],
    })
], RackBinModule);
//# sourceMappingURL=rack-bin.module.js.map