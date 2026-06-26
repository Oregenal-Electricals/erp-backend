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
exports.ImportOrderController = void 0;
const common_1 = require("@nestjs/common");
const import_order_service_1 = require("./import-order.service");
const import_order_dto_1 = require("./dto/import-order.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let ImportOrderController = class ImportOrderController {
    constructor(importOrderService) {
        this.importOrderService = importOrderService;
    }
    getStats(req) { return this.importOrderService.getStats(req.user); }
    findAll(req, query) { return this.importOrderService.findAll(req.user, query); }
    findOne(id, req) { return this.importOrderService.findOne(id, req.user); }
    create(dto, req) { return this.importOrderService.create(dto, req.user); }
    update(id, dto, req) { return this.importOrderService.update(id, dto, req.user); }
    approve(id, req) { return this.importOrderService.approve(id, req.user); }
    updateStatus(id, status, req) { return this.importOrderService.updateStatus(id, status, req.user); }
    cancel(id, req) { return this.importOrderService.cancel(id, req.user); }
    addItem(id, dto, req) { return this.importOrderService.addItem(id, dto, req.user); }
};
exports.ImportOrderController = ImportOrderController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImportOrderController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ImportOrderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ImportOrderController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [import_order_dto_1.CreateImportPoDto, Object]),
    __metadata("design:returntype", void 0)
], ImportOrderController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, import_order_dto_1.UpdateImportPoDto, Object]),
    __metadata("design:returntype", void 0)
], ImportOrderController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ImportOrderController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/status/:status'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('status')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ImportOrderController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ImportOrderController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/items'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, import_order_dto_1.ImportPoItemDto, Object]),
    __metadata("design:returntype", void 0)
], ImportOrderController.prototype, "addItem", null);
exports.ImportOrderController = ImportOrderController = __decorate([
    (0, common_1.Controller)('import-orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [import_order_service_1.ImportOrderService])
], ImportOrderController);
//# sourceMappingURL=import-order.controller.js.map