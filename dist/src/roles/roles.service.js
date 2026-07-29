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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let RolesService = class RolesService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    includes() {
        return { permissions: { where: { isActive: true } } };
    }
    async findAll(user) {
        const roles = await this.prisma.role.findMany({
            where: { companyId: user.companyId, isActive: true },
            include: this.includes(),
            orderBy: [{ isProtected: 'desc' }, { name: 'asc' }],
        });
        const roleNames = roles.map(r => r.name);
        const userCounts = await this.prisma.user.groupBy({
            by: ['role'],
            where: { companyId: user.companyId, role: { in: roleNames } },
            _count: true,
        });
        const countMap = new Map(userCounts.map(u => [u.role, u._count]));
        return roles.map(r => ({
            id: r.id,
            name: r.name,
            label: r.label,
            description: r.description,
            isSystemRole: r.isSystemRole,
            isProtected: r.isProtected,
            permissionCount: r.permissions.length,
            permissions: r.permissions.map(p => p.permission),
            userCount: countMap.get(r.name) || 0,
        }));
    }
    async findOne(id, user) {
        const role = await this.prisma.role.findFirst({
            where: { id, companyId: user.companyId },
            include: this.includes(),
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        const userCount = await this.prisma.user.count({ where: { companyId: user.companyId, role: role.name } });
        return {
            id: role.id, name: role.name, label: role.label, description: role.description,
            isSystemRole: role.isSystemRole, isProtected: role.isProtected,
            permissions: role.permissions.map(p => p.permission),
            userCount,
        };
    }
    async create(dto, user) {
        const existing = await this.prisma.role.findFirst({
            where: { companyId: user.companyId, name: dto.name },
        });
        if (existing)
            throw new common_1.ConflictException(`A role named "${dto.name}" already exists`);
        const role = await this.prisma.role.create({
            data: {
                companyId: user.companyId,
                name: dto.name,
                label: dto.label,
                description: dto.description,
                isSystemRole: false,
                isProtected: false,
                createdBy: user.id,
                updatedBy: user.id,
            },
        });
        if (dto.permissions.length > 0) {
            await this.prisma.rolePermission.createMany({
                data: dto.permissions.map(p => ({
                    companyId: user.companyId,
                    roleId: role.id,
                    permission: p,
                    createdBy: user.id,
                    updatedBy: user.id,
                })),
            });
        }
        await this.audit.log({ tableName: 'roles', recordId: role.id, action: 'CREATE', newValues: Object.assign(Object.assign({}, role), { permissions: dto.permissions }), changedBy: user.id });
        return this.findOne(role.id, user);
    }
    async update(id, dto, user) {
        const role = await this.assertEditable(id, user);
        const updated = await this.prisma.role.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'roles', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return this.findOne(id, user);
    }
    async updatePermissions(id, dto, user) {
        const role = await this.assertEditable(id, user);
        await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
        if (dto.permissions.length > 0) {
            await this.prisma.rolePermission.createMany({
                data: dto.permissions.map(p => ({
                    companyId: user.companyId,
                    roleId: id,
                    permission: p,
                    createdBy: user.id,
                    updatedBy: user.id,
                })),
            });
        }
        await this.prisma.role.update({ where: { id }, data: { updatedBy: user.id } });
        await this.audit.log({ tableName: 'role_permissions', recordId: id, action: 'UPDATE', newValues: { permissions: dto.permissions }, changedBy: user.id });
        return this.findOne(id, user);
    }
    async remove(id, user) {
        const role = await this.prisma.role.findFirst({ where: { id, companyId: user.companyId } });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        if (role.isProtected)
            throw new common_1.ForbiddenException('This role is protected and cannot be deleted.');
        const usersWithRole = await this.prisma.user.count({ where: { companyId: user.companyId, role: role.name } });
        if (usersWithRole > 0) {
            throw new common_1.BadRequestException(`Cannot delete this role - ${usersWithRole} user(s) are still assigned to it. Reassign them first.`);
        }
        await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
        await this.prisma.role.delete({ where: { id } });
        await this.audit.log({ tableName: 'roles', recordId: id, action: 'DELETE', newValues: { name: role.name }, changedBy: user.id });
        return { message: `Role "${role.label}" deleted.` };
    }
    async assertEditable(id, user) {
        const role = await this.prisma.role.findFirst({ where: { id, companyId: user.companyId } });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        if (role.isProtected)
            throw new common_1.ForbiddenException('This role is protected and its permissions cannot be changed.');
        return role;
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], RolesService);
//# sourceMappingURL=roles.service.js.map