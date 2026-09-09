"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionMaterialReturnController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const production_material_return_service_1 = require("./production-material-return.service");
const material_return_dto_1 = require("./dto/material-return.dto");
let ProductionMaterialReturnController = class ProductionMaterialReturnController {
    constructor(service) {
        this.service = service;
    }
    getPreviousMaterialStatus(workOrderId, req) {
        return this.service.getPreviousMaterialStatus(workOrderId, req.user);
    }
    create(dto, req) {
        return this.service.create(dto, req.user);
    }
};
exports.ProductionMaterialReturnController = ProductionMaterialReturnController;
__decorate([
    (0, common_1.Get)('status/:workOrderId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('workOrderId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductionMaterialReturnController.prototype, "getPreviousMaterialStatus", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [material_return_dto_1.CreateMaterialReturnDto, Object]),
    __metadata("design:returntype", void 0)
], ProductionMaterialReturnController.prototype, "create", null);
exports.ProductionMaterialReturnController = ProductionMaterialReturnController = __decorate([
    (0, common_1.Controller)('production/material-returns'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [production_material_return_service_1.ProductionMaterialReturnService])
], ProductionMaterialReturnController);
//# sourceMappingURL=production-material-return.controller.js.map