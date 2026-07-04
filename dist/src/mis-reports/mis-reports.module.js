"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MisReportsModule = void 0;
const common_1 = require("@nestjs/common");
const mis_reports_controller_1 = require("./mis-reports.controller");
const mis_reports_service_1 = require("./mis-reports.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let MisReportsModule = class MisReportsModule {
};
exports.MisReportsModule = MisReportsModule;
exports.MisReportsModule = MisReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [mis_reports_controller_1.MisReportsController],
        providers: [mis_reports_service_1.MisReportsService],
        exports: [mis_reports_service_1.MisReportsService],
    })
], MisReportsModule);
//# sourceMappingURL=mis-reports.module.js.map