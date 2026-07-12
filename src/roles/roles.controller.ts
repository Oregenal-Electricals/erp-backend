import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, UpdateRolePermissionsDto } from './dto/role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(Permission.SYSTEM_MANAGE_ROLES)
  findAll(@Request() req: any) { return this.rolesService.findAll(req.user); }

  @Get(':id')
  @RequirePermissions(Permission.SYSTEM_MANAGE_ROLES)
  findOne(@Param('id') id: string, @Request() req: any) { return this.rolesService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.SYSTEM_MANAGE_ROLES)
  create(@Body() dto: CreateRoleDto, @Request() req: any) { return this.rolesService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.SYSTEM_MANAGE_ROLES)
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Request() req: any) { return this.rolesService.update(id, dto, req.user); }

  @Put(':id/permissions')
  @RequirePermissions(Permission.SYSTEM_MANAGE_ROLES)
  updatePermissions(@Param('id') id: string, @Body() dto: UpdateRolePermissionsDto, @Request() req: any) { return this.rolesService.updatePermissions(id, dto, req.user); }

  @Delete(':id')
  @RequirePermissions(Permission.SYSTEM_MANAGE_ROLES)
  remove(@Param('id') id: string, @Request() req: any) { return this.rolesService.remove(id, req.user); }
}
