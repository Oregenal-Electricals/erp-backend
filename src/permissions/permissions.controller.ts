import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  getPermissionsForRole,
  ROLE_PERMISSIONS,
} from '../common/permissions/role-permissions';
import { Permission } from '../common/permissions/permissions.enum';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionsController {
  @Get('my-permissions')
  @ApiOperation({ summary: 'Get all permissions for the current user role' })
  getMyPermissions(@CurrentUser() user: any) {
    const permissions = getPermissionsForRole(user.role);
    return {
      role: user.role,
      permissions,
      total: permissions.length,
    };
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Get all permissions for a specific role' })
  getPermissionsForRole(@Param('role') role: UserRole) {
    const permissions = getPermissionsForRole(role);
    return {
      role,
      permissions,
      total: permissions.length,
    };
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all permissions and role mappings' })
  getAllPermissions() {
    return {
      permissions: Object.values(Permission),
      rolePermissions: Object.entries(ROLE_PERMISSIONS).map(
        ([role, perms]) => ({
          role,
          permissions: perms,
          total: perms.length,
        }),
      ),
    };
  }
}
