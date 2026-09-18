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
exports.DispatchConfirmationController = void 0;
const common_1 = require("@nestjs/common");
const dispatch_confirmation_service_1 = require("./dispatch-confirmation.service");
const dispatch_confirmation_dto_1 = require("./dto/dispatch-confirmation.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let DispatchConfirmationController = class DispatchConfirmationController {
    constructor(confirmationService) {
        this.confirmationService = confirmationService;
    }
    findOne(id, req) {
        return this.confirmationService.findOne(id, req.user);
    }
    createConfirmation(dto, req) {
        return this.confirmationService.createConfirmation(dto.loadingId, req.user);
    }
    confirmPackage(id, dto, req) {
        return this.confirmationService.confirmPackage(id, dto.packageId, req.user);
    }
    reverseConfirmationItem(itemId, dto, req) {
        return this.confirmationService.reverseConfirmationItem(itemId, dto.reason, req.user);
    }
};
exports.DispatchConfirmationController = DispatchConfirmationController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_CONFIRM_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchConfirmationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_CONFIRM_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dispatch_confirmation_dto_1.CreateConfirmationDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchConfirmationController.prototype, "createConfirmation", null);
__decorate([
    (0, common_1.Post)(':id/packages'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_CONFIRM_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_confirmation_dto_1.ConfirmPackageDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchConfirmationController.prototype, "confirmPackage", null);
__decorate([
    (0, common_1.Post)('items/:itemId/reverse'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_CONFIRM_REVERSE),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_confirmation_dto_1.ReverseConfirmationDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchConfirmationController.prototype, "reverseConfirmationItem", null);
exports.DispatchConfirmationController = DispatchConfirmationController = __decorate([
    (0, common_1.Controller)('dispatch-confirmation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [dispatch_confirmation_service_1.DispatchConfirmationService])
], DispatchConfirmationController);
//# sourceMappingURL=dispatch-confirmation.controller.js.map