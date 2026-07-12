import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateRoleDto, UpdateRolePermissionsDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private includes() {
    return { permissions: { where: { isActive: true } } };
  }

  async findAll(user: any) {
    const roles = await this.prisma.role.findMany({
      where: { companyId: user.companyId, isActive: true },
      include: this.includes(),
      orderBy: [{ isProtected: 'desc' }, { name: 'asc' }],
    });

    // For each role, count how many users currently hold it (needed by
    // the frontend to explain why a role can't be deleted).
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

  async findOne(id: string, user: any) {
    const role = await this.prisma.role.findFirst({
      where: { id, companyId: user.companyId },
      include: this.includes(),
    });
    if (!role) throw new NotFoundException('Role not found');
    const userCount = await this.prisma.user.count({ where: { companyId: user.companyId, role: role.name } });
    return {
      id: role.id, name: role.name, label: role.label, description: role.description,
      isSystemRole: role.isSystemRole, isProtected: role.isProtected,
      permissions: role.permissions.map(p => p.permission),
      userCount,
    };
  }

  async create(dto: CreateRoleDto, user: any) {
    const existing = await this.prisma.role.findFirst({
      where: { companyId: user.companyId, name: dto.name },
    });
    if (existing) throw new ConflictException(`A role named "${dto.name}" already exists`);

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

    await this.audit.log({ tableName: 'roles', recordId: role.id, action: 'CREATE', newValues: { ...role, permissions: dto.permissions }, changedBy: user.id });
    return this.findOne(role.id, user);
  }

  async update(id: string, dto: UpdateRoleDto, user: any) {
    const role = await this.assertEditable(id, user);
    const updated = await this.prisma.role.update({
      where: { id },
      data: { ...dto, updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'roles', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return this.findOne(id, user);
  }

  /**
   * Fully replaces a role's permission set. This is the core "editable
   * permissions" feature - protected roles (Super Admin) can never reach
   * this, enforced here at the service layer regardless of what the
   * frontend does or doesn't show.
   */
  async updatePermissions(id: string, dto: UpdateRolePermissionsDto, user: any) {
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

  /**
   * Deleting a role is blocked in two cases:
   * 1. It's isProtected (Super Admin) - can never be deleted, no exceptions.
   * 2. Any user is currently assigned this role - must reassign those
   *    users to a different role first, so nobody is silently left with
   *    a role that no longer exists.
   */
  async remove(id: string, user: any) {
    const role = await this.prisma.role.findFirst({ where: { id, companyId: user.companyId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isProtected) throw new ForbiddenException('This role is protected and cannot be deleted.');

    const usersWithRole = await this.prisma.user.count({ where: { companyId: user.companyId, role: role.name } });
    if (usersWithRole > 0) {
      throw new BadRequestException(`Cannot delete this role - ${usersWithRole} user(s) are still assigned to it. Reassign them first.`);
    }

    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });

    await this.audit.log({ tableName: 'roles', recordId: id, action: 'DELETE', newValues: { name: role.name }, changedBy: user.id });
    return { message: `Role "${role.label}" deleted.` };
  }

  /** Shared guard: throws if the role doesn't exist or is protected. */
  private async assertEditable(id: string, user: any) {
    const role = await this.prisma.role.findFirst({ where: { id, companyId: user.companyId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isProtected) throw new ForbiddenException('This role is protected and its permissions cannot be changed.');
    return role;
  }
}
