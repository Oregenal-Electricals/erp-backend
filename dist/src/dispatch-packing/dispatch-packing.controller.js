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
exports.DispatchPackingController = void 0;
const common_1 = require("@nestjs/common");
const dispatch_packing_service_1 = require("./dispatch-packing.service");
const dispatch_packing_dto_1 = require("./dto/dispatch-packing.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let DispatchPackingController = class DispatchPackingController {
    constructor(dpService) {
        this.dpService = dpService;
    }
    findOne(id, req) {
        return this.dpService.findOne(id, req.user);
    }
    createPacking(dto, req) {
        return this.dpService.createPacking(dto.verificationId, req.user);
    }
    createPackage(packingId, dto, req) {
        return this.dpService.createPackage(packingId, req.user, dto.packageType, dto.netWeight, dto.grossWeight);
    }
    addPackageItem(packageId, dto, req) {
        return this.dpService.addPackageItem(packageId, dto.verificationItemId, dto.packedQty, req.user);
    }
    reversePackageItem(packageItemId, dto, req) {
        return this.dpService.reversePackageItem(packageItemId, dto.reverseQty, dto.reason, req.user);
    }
};
exports.DispatchPackingController = DispatchPackingController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_PACK_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchPackingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_PACK_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dispatch_packing_dto_1.CreatePackingDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchPackingController.prototype, "createPacking", null);
__decorate([
    (0, common_1.Post)(':packingId/packages'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_PACK_CREATE),
    __param(0, (0, common_1.Param)('packingId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_packing_dto_1.CreatePackageDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchPackingController.prototype, "createPackage", null);
__decorate([
    (0, common_1.Post)('packages/:packageId/items'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_PACK_CONFIRM),
    __param(0, (0, common_1.Param)('packageId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_packing_dto_1.AddPackageItemDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchPackingController.prototype, "addPackageItem", null);
__decorate([
    (0, common_1.Post)('package-items/:packageItemId/reverse'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_PACK_REVERSE),
    __param(0, (0, common_1.Param)('packageItemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_packing_dto_1.ReversePackageItemDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchPackingController.prototype, "reversePackageItem", null);
exports.DispatchPackingController = DispatchPackingController = __decorate([
    (0, common_1.Controller)('dispatch-packing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [dispatch_packing_service_1.DispatchPackingService])
], DispatchPackingController);
//# sourceMappingURL=dispatch-packing.controller.js.map