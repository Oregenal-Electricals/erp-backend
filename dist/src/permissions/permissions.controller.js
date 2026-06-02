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
exports.PermissionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const role_permissions_1 = require("../common/permissions/role-permissions");
const permissions_enum_1 = require("../common/permissions/permissions.enum");
let PermissionsController = class PermissionsController {
    getMyPermissions(user) {
        const permissions = (0, role_permissions_1.getPermissionsForRole)(user.role);
        return {
            role: user.role,
            permissions,
            total: permissions.length,
        };
    }
    getPermissionsForRole(role) {
        const permissions = (0, role_permissions_1.getPermissionsForRole)(role);
        return {
            role,
            permissions,
            total: permissions.length,
        };
    }
    getAllPermissions() {
        return {
            permissions: Object.values(permissions_enum_1.Permission),
            rolePermissions: Object.entries(role_permissions_1.ROLE_PERMISSIONS).map(([role, perms]) => ({
                role,
                permissions: perms,
                total: perms.length,
            })),
        };
    }
};
exports.PermissionsController = PermissionsController;
__decorate([
    (0, common_1.Get)('my-permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all permissions for the current user role' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PermissionsController.prototype, "getMyPermissions", null);
__decorate([
    (0, common_1.Get)('role/:role'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all permissions for a specific role' }),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PermissionsController.prototype, "getPermissionsForRole", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all permissions and role mappings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PermissionsController.prototype, "getAllPermissions", null);
exports.PermissionsController = PermissionsController = __decorate([
    (0, swagger_1.ApiTags)('Permissions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('permissions')
], PermissionsController);
//# sourceMappingURL=permissions.controller.js.map