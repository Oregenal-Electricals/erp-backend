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
exports.DispatchVerificationController = void 0;
const common_1 = require("@nestjs/common");
const dispatch_verification_service_1 = require("./dispatch-verification.service");
const dispatch_verification_dto_1 = require("./dto/dispatch-verification.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let DispatchVerificationController = class DispatchVerificationController {
    constructor(dvService) {
        this.dvService = dvService;
    }
    findOne(id, req) {
        return this.dvService.findOne(id, req.user);
    }
    createVerification(dto, req) {
        return this.dvService.createVerification(dto.pickListId, req.user);
    }
    verifyItem(verificationId, dto, req) {
        return this.dvService.verifyItem(verificationId, dto.pickListItemId, dto.verifiedQty, req.user);
    }
    reverseVerification(verificationItemId, dto, req) {
        return this.dvService.reverseVerification(verificationItemId, dto.reverseQty, dto.reason, req.user);
    }
};
exports.DispatchVerificationController = DispatchVerificationController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_VERIFY_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispatchVerificationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_VERIFY_CONFIRM),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dispatch_verification_dto_1.CreateVerificationDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchVerificationController.prototype, "createVerification", null);
__decorate([
    (0, common_1.Post)(':verificationId/verify'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_VERIFY_CONFIRM),
    __param(0, (0, common_1.Param)('verificationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_verification_dto_1.VerifyItemDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchVerificationController.prototype, "verifyItem", null);
__decorate([
    (0, common_1.Post)('items/:verificationItemId/reverse'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DISPATCH_VERIFY_REVERSE),
    __param(0, (0, common_1.Param)('verificationItemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_verification_dto_1.ReverseVerificationDto, Object]),
    __metadata("design:returntype", void 0)
], DispatchVerificationController.prototype, "reverseVerification", null);
exports.DispatchVerificationController = DispatchVerificationController = __decorate([
    (0, common_1.Controller)('dispatch-verifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [dispatch_verification_service_1.DispatchVerificationService])
], DispatchVerificationController);
//# sourceMappingURL=dispatch-verification.controller.js.map