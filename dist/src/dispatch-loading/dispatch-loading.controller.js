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
exports.DispatchLoadingController = void 0;
const common_1 = require("@nestjs/common");
const dispatch_loading_service_1 = require("./dispatch-loading.service");
const dispatch_loading_dto_1 = require("./dto/dispatch-loading.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let DispatchLoadingController = class DispatchLoadingController {
    constructor(loadingService) {
        this.loadingService = loadingService;
    }
    findOne(id, req) {
        return this.loadingService.findOne(id, req.user);
    }
    startLoading(dto, req) {
        return this.loadingService.startLoading(dto.transportAssignmentId, dto.actualVehicleNumber, req.user);
    }
    loadPackage(id, dto, req) {
        return this.loadingService.loadPackage(id, dto.packageId, dto.actualVehicleNumber, req.user);
    }
    unloadPackage(itemId, dto, req) {
        return this.loadingService.unloadPackage(itemId, dto.reason, req.user);
    }
    completeLoading(id, req) {
        return this.loadingService.completeLoading(id, req.user);
    }
};
exports.DispatchLoadingController = DispatchLoadingController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_LOADING_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchLoadingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_LOADING_START),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dispatch_loading_dto_1.StartLoadingDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchLoadingController.prototype, "startLoading", null);
__decorate([
    (0, common_1.Post)(':id/packages'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_LOADING_CONFIRM),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_loading_dto_1.LoadPackageDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchLoadingController.prototype, "loadPackage", null);
__decorate([
    (0, common_1.Post)('items/:itemId/unload'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_LOADING_UNLOAD),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_loading_dto_1.UnloadPackageDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchLoadingController.prototype, "unloadPackage", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_LOADING_COMPLETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchLoadingController.prototype, "completeLoading", null);
exports.DispatchLoadingController = DispatchLoadingController = __decorate([
    (0, common_1.Controller)('dispatch-loading'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [dispatch_loading_service_1.DispatchLoadingService])
], DispatchLoadingController);
//# sourceMappingURL=dispatch-loading.controller.js.map