"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomsEntryModule = void 0;
const common_1 = require("@nestjs/common");
const customs_entry_controller_1 = require("./customs-entry.controller");
const customs_entry_service_1 = require("./customs-entry.service");
const prisma_module_1 = require("../prisma/prisma.module");
const common_module_1 = require("../common/common.module");
let CustomsEntryModule = class CustomsEntryModule {
};
exports.CustomsEntryModule = CustomsEntryModule;
exports.CustomsEntryModule = CustomsEntryModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, common_module_1.CommonModule],
        controllers: [customs_entry_controller_1.CustomsEntryController],
        providers: [customs_entry_service_1.CustomsEntryService],
        exports: [customs_entry_service_1.CustomsEntryService],
    })
], CustomsEntryModule);
//# sourceMappingURL=customs-entry.module.js.map