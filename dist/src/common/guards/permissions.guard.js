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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermissions || requiredPermissions.length === 0)
            return true;
        const { user } = context.switchToHttp().getRequest();
        if (!user)
            throw new common_1.ForbiddenException('No user found in request');
        const allRoles = user.allRoles ||
            [user.role, ...(user.additionalRoles || [])].filter((v, i, a) => a.indexOf(v) === i);
        if (allRoles.some((r) => r === 'SUPER_ADMIN'))
            return true;
        const roles = await this.prisma.role.findMany({
            where: { name: { in: allRoles }, companyId: user.companyId, isActive: true },
            include: { permissions: { where: { isActive: true } } },
        });
        const grantedPermissions = new Set();
        for (const role of roles) {
            for (const rp of role.permissions) {
                grantedPermissions.add(rp.permission);
            }
        }
        const hasAll = requiredPermissions.every((p) => grantedPermissions.has(p));
        if (!hasAll) {
            const missing = requiredPermissions.filter((p) => !grantedPermissions.has(p));
            throw new common_1.ForbiddenException(`Missing permissions: ${missing.join(',')}`);
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector, prisma_service_1.PrismaService])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map