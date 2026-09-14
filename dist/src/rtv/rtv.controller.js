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
exports.RtvController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
const rtv_service_1 = require("./rtv.service");
const rtv_dto_1 = require("./dto/rtv.dto");
let RtvController = class RtvController {
    constructor(service) {
        this.service = service;
    }
    findPending(req) { return this.service.findPending(req.user); }
    findReadyForGateOut(req) { return this.service.findReadyForGateOut(req.user); }
    findForRejectedItem(id, req) { return this.service.findForRejectedItem(id, req.user); }
    findOne(id, req) { return this.service.findOne(id, req.user); }
    request(dto, req) { return this.service.request(dto, req.user); }
    decide(id, dto, req) { return this.service.decide(id, dto, req.user); }
    prepare(id, dto, req) { return this.service.prepare(id, dto, req.user); }
    gateOut(id, dto, req) { return this.service.gateOut(id, dto, req.user); }
    cancel(id, req) { return this.service.cancel(id, req.user); }
};
exports.RtvController = RtvController;
__decorate([
    (0, common_1.Get)('pending'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RtvController.prototype, "findPending", null);
__decorate([
    (0, common_1.Get)('ready-for-gate-out'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RtvController.prototype, "findReadyForGateOut", null);
__decorate([
    (0, common_1.Get)('rejected-item/:rejectedStockItemId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('rejectedStockItemId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RtvController.prototype, "findForRejectedItem", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.INVENTORY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RtvController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STORE_RTV_PREPARE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rtv_dto_1.RequestRtvDto, Object]),
    __metadata("design:returntype", void 0)
], RtvController.prototype, "request", null);
__decorate([
    (0, common_1.Post)(':id/decide'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_RTV_AUTHORIZE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rtv_dto_1.DecideRtvDto, Object]),
    __metadata("design:returntype", void 0)
], RtvController.prototype, "decide", null);
__decorate([
    (0, common_1.Post)(':id/prepare'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STORE_RTV_PREPARE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rtv_dto_1.PrepareRtvDto, Object]),
    __metadata("design:returntype", void 0)
], RtvController.prototype, "prepare", null);
__decorate([
    (0, common_1.Post)(':id/gate-out'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.GATE_RTV_OUT_CONFIRM),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rtv_dto_1.GateOutRtvDto, Object]),
    __metadata("design:returntype", void 0)
], RtvController.prototype, "gateOut", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.STORE_RTV_CANCEL),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RtvController.prototype, "cancel", null);
exports.RtvController = RtvController = __decorate([
    (0, common_1.Controller)('rtv'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [rtv_service_1.RtvService])
], RtvController);
//# sourceMappingURL=rtv.controller.js.map