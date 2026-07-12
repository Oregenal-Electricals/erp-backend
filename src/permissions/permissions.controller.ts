import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private prisma: PrismaService) {}

  private async getPermissionsForRoleName(companyId: string, roleName: string): Promise<string[]> {
    const role = await this.prisma.role.findFirst({
      where: { companyId, name: roleName, isActive: true },
      include: { permissions: { where: { isActive: true } } },
    });
    if (!role) return [];
    return role.permissions.map(p => p.permission);
  }

  @Get('my-permissions')
  @ApiOperation({ summary: 'Get all permissions for the current user (from their actual assigned role(s) in the database)' })
  async getMyPermissions(@CurrentUser() user: any) {
    // SUPER_ADMIN always has everything, matching the guard's hard safety net.
    const allRoles: string[] = user.allRoles || [user.role, ...(user.additionalRoles || [])];
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

  @Get('role/:role')
  @ApiOperation({ summary: 'Get all permissions for a specific role name (from the database)' })
  async getPermissionsForRole(@Param('role') role: string, @CurrentUser() user: any) {
    const permissions = await this.getPermissionsForRoleName(user.companyId, role);
    return { role, permissions, total: permissions.length };
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all roles and their permission mappings (from the database)' })
  async getAllPermissions(@CurrentUser() user: any) {
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
}
