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
exports.CustomerPortalController = void 0;
const common_1 = require("@nestjs/common");
const customer_portal_service_1 = require("./customer-portal.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let CustomerPortalController = class CustomerPortalController {
    constructor(cpService) {
        this.cpService = cpService;
    }
    getDashboard(customerId, req) {
        return this.cpService.getCustomerDashboard(customerId, req.user.companyId);
    }
    getOrders(customerId, query, req) {
        return this.cpService.getCustomerOrders(customerId, req.user.companyId, query);
    }
    getDispatches(customerId, req) {
        return this.cpService.getCustomerDispatches(customerId, req.user.companyId);
    }
    getComplaints(customerId, req) {
        return this.cpService.getCustomerComplaints(customerId, req.user.companyId);
    }
};
exports.CustomerPortalController = CustomerPortalController;
__decorate([
    (0, common_1.Get)('dashboard/:customerId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.CUSTOMER_PORTAL_VIEW),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerPortalController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('orders/:customerId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.CUSTOMER_PORTAL_VIEW),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CustomerPortalController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('dispatches/:customerId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.CUSTOMER_PORTAL_VIEW),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerPortalController.prototype, "getDispatches", null);
__decorate([
    (0, common_1.Get)('complaints/:customerId'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.CUSTOMER_PORTAL_VIEW),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerPortalController.prototype, "getComplaints", null);
exports.CustomerPortalController = CustomerPortalController = __decorate([
    (0, common_1.Controller)('customer-portal'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [customer_portal_service_1.CustomerPortalService])
], CustomerPortalController);
//# sourceMappingURL=customer-portal.controller.js.map