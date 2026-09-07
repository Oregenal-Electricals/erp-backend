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
exports.ProductTargetController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const product_target_service_1 = require("./product-target.service");
const product_target_dto_1 = require("./dto/product-target.dto");
let ProductTargetController = class ProductTargetController {
    constructor(service) {
        this.service = service;
    }
    findAll(req, query) {
        return this.service.findAll(req.user, query);
    }
    findByProduct(productId, req) {
        return this.service.findByProduct(productId, req.user);
    }
    findCurrent(productId, req) {
        return this.service.findCurrent(productId, req.user);
    }
    create(dto, req) {
        return this.service.create(dto, req.user);
    }
    revise(productId, dto, req) {
        return this.service.revise(productId, dto, req.user);
    }
};
exports.ProductTargetController = ProductTargetController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_TARGET_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductTargetController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('product/:productId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_TARGET_VIEW),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductTargetController.prototype, "findByProduct", null);
__decorate([
    (0, common_1.Get)('product/:productId/current'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_TARGET_VIEW),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductTargetController.prototype, "findCurrent", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_TARGET_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_target_dto_1.CreateProductTargetDto, Object]),
    __metadata("design:returntype", void 0)
], ProductTargetController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('product/:productId/revise'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PRODUCTION_TARGET_MANAGE),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_target_dto_1.ReviseProductTargetDto, Object]),
    __metadata("design:returntype", void 0)
], ProductTargetController.prototype, "revise", null);
exports.ProductTargetController = ProductTargetController = __decorate([
    (0, common_1.Controller)('production/targets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [product_target_service_1.ProductTargetService])
], ProductTargetController);
//# sourceMappingURL=product-target.controller.js.map