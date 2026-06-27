import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../permissions/permissions.enum';
import { roleHasPermission } from '../permissions/role-permissions';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    // SUPER_ADMIN in any role = bypass all checks
    if (allRoles.some(r => r === 'SUPER_ADMIN')) return true;

    // Check if ANY role has ALL required permissions
    const hasAll = requiredPermissions.every((permission) =>
      allRoles.some((role) => roleHasPermission(role as any, permission))
    );

    if (!hasAll) {
      const missing = requiredPermissions.filter(
        (p) => !allRoles.some((role) => roleHasPermission(role as any, p))
      );
      throw new ForbiddenException(`Missing permissions: ${missing.join(',')}`);
    }
    return true;
  }
}
