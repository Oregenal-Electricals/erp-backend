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
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
let PermissionsController = class PermissionsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPermissionsForRoleName(companyId, roleName) {
        const role = await this.prisma.role.findFirst({
            where: { companyId, name: roleName, isActive: true },
            include: { permissions: { where: { isActive: true } } },
        });
        if (!role)
            return [];
        return role.permissions.map(p => p.permission);
    }
    async getMyPermissions(user) {
        const allRoles = user.allRoles || [user.role, ...(user.additionalRoles || [])];
        if (allRoles.includes('SUPER_ADMIN')) {
            const superAdminRole = await this.prisma.role.findFirst({
                where: { companyId: user.companyId, name: 'SUPER_ADMIN' },
                include: { permissions: true },
            });
            const permissions = superAdminRole ? superAdminRole.permissions.map(p => p.permission) : [];
            return { role: user.role, permissions, total: permissions.length };
        }
        const permSets = await Promise.all(allRoles.map(r => this.getPermissionsForRoleName(user.companyId, r)));
        const permissions = Array.from(new Set(permSets.flat()));
        return { role: user.role, permissions, total: permissions.length };
    }
    async getPermissionsForRole(role, user) {
        const permissions = await this.getPermissionsForRoleName(user.companyId, role);
        return { role, permissions, total: permissions.length };
    }
    async getAllPermissions(user) {
        const roles = await this.prisma.role.findMany({
            where: { companyId: user.companyId, isActive: true },
            include: { permissions: { where: { isActive: true } } },
            orderBy: { name: 'asc' },
        });
        return {
            rolePermissions: roles.map(r => ({
                role: r.name,
                permissions: r.permissions.map(p => p.permission),
                total: r.permissions.length,
            })),
        };
    }
};
exports.PermissionsController = PermissionsController;
__decorate([
    (0, common_1.Get)('my-permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all permissions for the current user (from their actual assigned role(s) in the database)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "getMyPermissions", null);
__decorate([
    (0, common_1.Get)('role/:role'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all permissions for a specific role name (from the database)' }),
    __param(0, (0, common_1.Param)('role')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "getPermissionsForRole", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all roles and their permission mappings (from the database)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "getAllPermissions", null);
exports.PermissionsController = PermissionsController = __decorate([
    (0, swagger_1.ApiTags)('Permissions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('permissions'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionsController);
//# sourceMappingURL=permissions.controller.js.map