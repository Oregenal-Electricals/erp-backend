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
exports.VendorPortalController = void 0;
const common_1 = require("@nestjs/common");
const vendor_portal_service_1 = require("./vendor-portal.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let VendorPortalController = class VendorPortalController {
    constructor(vpService) {
        this.vpService = vpService;
    }
    getDashboard(vendorId, req) {
        return this.vpService.getVendorDashboard(vendorId, req.user.companyId);
    }
    getPOs(vendorId, query, req) {
        return this.vpService.getVendorPOs(vendorId, req.user.companyId, query);
    }
    getRFQs(vendorId, req) {
        return this.vpService.getVendorRFQs(vendorId, req.user.companyId);
    }
    getQuotations(vendorId, req) {
        return this.vpService.getVendorQuotations(vendorId, req.user.companyId);
    }
};
exports.VendorPortalController = VendorPortalController;
__decorate([
    (0, common_1.Get)('dashboard/:vendorId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VENDOR_PORTAL_VIEW),
    __param(0, (0, common_1.Param)('vendorId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VendorPortalController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('purchase-orders/:vendorId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VENDOR_PORTAL_VIEW),
    __param(0, (0, common_1.Param)('vendorId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], VendorPortalController.prototype, "getPOs", null);
__decorate([
    (0, common_1.Get)('rfqs/:vendorId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VENDOR_PORTAL_VIEW),
    __param(0, (0, common_1.Param)('vendorId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VendorPortalController.prototype, "getRFQs", null);
__decorate([
    (0, common_1.Get)('quotations/:vendorId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VENDOR_PORTAL_VIEW),
    __param(0, (0, common_1.Param)('vendorId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VendorPortalController.prototype, "getQuotations", null);
exports.VendorPortalController = VendorPortalController = __decorate([
    (0, common_1.Controller)('vendor-portal'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [vendor_portal_service_1.VendorPortalService])
], VendorPortalController);
//# sourceMappingURL=vendor-portal.controller.js.map