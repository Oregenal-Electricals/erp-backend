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
exports.SalesOrdersController = void 0;
const common_1 = require("@nestjs/common");
const sales_orders_service_1 = require("./sales-orders.service");
const sales_order_dto_1 = require("./dto/sales-order.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let SalesOrdersController = class SalesOrdersController {
    constructor(soService) {
        this.soService = soService;
    }
    getStats(req) { return this.soService.getStats(req.user); }
    getByCpo(cpoId, req) { return this.soService.getByCpo(cpoId, req.user); }
    findAll(req, query) { return this.soService.findAll(req.user, query); }
    findOne(id, req) { return this.soService.findOne(id, req.user); }
    create(dto, req) { return this.soService.create(dto, req.user); }
    confirm(id, req) { return this.soService.confirm(id, req.user); }
    cancel(id, dto, req) { return this.soService.cancel(id, dto, req.user); }
};
exports.SalesOrdersController = SalesOrdersController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('by-cpo/:cpoId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Param)('cpoId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "getByCpo", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_ORDER_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_order_dto_1.CreateSoDto, Object]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SALES_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_order_dto_1.CancelSoDto, Object]),
    __metadata("design:returntype", void 0)
], SalesOrdersController.prototype, "cancel", null);
exports.SalesOrdersController = SalesOrdersController = __decorate([
    (0, common_1.Controller)('sales-orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [sales_orders_service_1.SalesOrdersService])
], SalesOrdersController);
//# sourceMappingURL=sales-orders.controller.js.map