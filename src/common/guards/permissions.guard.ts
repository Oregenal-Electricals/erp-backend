import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../permissions/permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No user found in request');

    // Build allRoles from JWT payload (primary + additional)
    const allRoles: string[] = user.allRoles ||
      [user.role, ...(user.additionalRoles || [])].filter((v, i, a) => a.indexOf(v) === i);

    // Hard-coded safety net: SUPER_ADMIN always bypasses every check by
    // name, regardless of what's actually synced in the database. This
    // exists specifically to prevent a lockout scenario - if a new
    // Permission is ever added to the enum before someone remembers to
    // grant it to Super Admin's DB row, Super Admin still isn't blocked.
    if (allRoles.some((r) => r === 'SUPER_ADMIN')) return true;

    // Look up every matching role's granted permissions from the
    // database (replaces the old static role-permissions.ts lookup).
    const roles = await this.prisma.role.findMany({
      where: { name: { in: allRoles }, companyId: user.companyId, isActive: true },
      include: { permissions: { where: { isActive: true } } },
    });

    const grantedPermissions = new Set<string>();
    for (const role of roles) {
      for (const rp of role.permissions) {
        grantedPermissions.add(rp.permission);
      }
    }

    const hasAll = requiredPermissions.every((p) => grantedPermissions.has(p));
    if (!hasAll) {
      const missing = requiredPermissions.filter((p) => !grantedPermissions.has(p));
      throw new ForbiddenException(`Missing permissions: ${missing.join(',')}`);
    }

    return true;
  }
}
