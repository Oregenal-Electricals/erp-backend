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
exports.PoApprovalController = void 0;
const common_1 = require("@nestjs/common");
const po_approval_service_1 = require("./po-approval.service");
const po_approval_dto_1 = require("./dto/po-approval.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let PoApprovalController = class PoApprovalController {
    constructor(poApprovalService) {
        this.poApprovalService = poApprovalService;
    }
    getStats(req) { return this.poApprovalService.getStats(req.user); }
    getSettings(req) { return this.poApprovalService.getSettings(req.user); }
    createSetting(dto, req) { return this.poApprovalService.createSetting(dto, req.user); }
    updateSetting(id, dto, req) { return this.poApprovalService.updateSetting(id, dto, req.user); }
    getPending(req) { return this.poApprovalService.getPending(req.user); }
    getHistory(poId, req) { return this.poApprovalService.getHistory(poId, req.user); }
    approve(poId, dto, req) { return this.poApprovalService.approve(poId, dto, req.user); }
    reject(poId, dto, req) { return this.poApprovalService.reject(poId, dto, req.user); }
};
exports.PoApprovalController = PoApprovalController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PoApprovalController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PoApprovalController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('settings'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_MANAGE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [po_approval_dto_1.CreateApprovalSettingDto, Object]),
    __metadata("design:returntype", void 0)
], PoApprovalController.prototype, "createSetting", null);
__decorate([
    (0, common_1.Put)('settings/:id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.SETTINGS_MANAGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, po_approval_dto_1.UpdateApprovalSettingDto, Object]),
    __metadata("design:returntype", void 0)
], PoApprovalController.prototype, "updateSetting", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PoApprovalController.prototype, "getPending", null);
__decorate([
    (0, common_1.Get)(':poId/history'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_VIEW),
    __param(0, (0, common_1.Param)('poId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PoApprovalController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)(':poId/approve'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_EDIT),
    __param(0, (0, common_1.Param)('poId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, po_approval_dto_1.ApprovePoDto, Object]),
    __metadata("design:returntype", void 0)
], PoApprovalController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':poId/reject'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.PURCHASE_EDIT),
    __param(0, (0, common_1.Param)('poId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, po_approval_dto_1.RejectPoDto, Object]),
    __metadata("design:returntype", void 0)
], PoApprovalController.prototype, "reject", null);
exports.PoApprovalController = PoApprovalController = __decorate([
    (0, common_1.Controller)('po-approvals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [po_approval_service_1.PoApprovalService])
], PoApprovalController);
//# sourceMappingURL=po-approval.controller.js.map