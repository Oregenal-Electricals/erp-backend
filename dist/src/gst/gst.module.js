"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GstModule = void 0;
const common_1 = require("@nestjs/common");
const gst_controller_1 = require("./gst.controller");
const gst_service_1 = require("./gst.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let GstModule = class GstModule {
};
exports.GstModule = GstModule;
exports.GstModule = GstModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [gst_controller_1.GstController],
        providers: [gst_service_1.GstService],
        exports: [gst_service_1.GstService],
    })
], GstModule);
//# sourceMappingURL=gst.module.js.map