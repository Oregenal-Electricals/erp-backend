// erp-backend/src/ui-control/ui-control.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { UiControlService } from './ui-control.service';
import {
  SyncElementsDto,
  CreateElementDto,
  UpdateElementDto,
  ReorderElementsDto,
  BulkUpsertOverridesDto,
} from './dto/ui-control.dto';

function rolesOf(user: any): string[] {
  return user.allRoles || [user.role, ...(user.additionalRoles || [])].filter((v, i, a) => a.indexOf(v) === i);
}

@Controller('ui-control')
@UseGuards(JwtAuthGuard)
export class UiControlController {
  constructor(private readonly service: UiControlService) {}

  // ── Every logged-in user, no extra permission — these two power the real UI ──
  @Get('my-visibility')
  async myVisibility(@CurrentUser() user: any) {
    return this.service.getEffectiveVisibility(user.companyId, user.id, rolesOf(user));
  }

  @Get('my-sidebar')
  async mySidebar(@CurrentUser() user: any) {
    return this.service.getMySidebar(user.companyId, user.id, rolesOf(user));
  }

  // ── Everything below requires UI_CONTROL_MANAGE ──
  @Get('elements')
  @UseGuards(PermissionsGuard) @RequirePermissions(Permission.UI_CONTROL_MANAGE)
  async listElements(@CurrentUser() user: any, @Query('module') module?: string) {
    return this.service.listElements(user.companyId, module);
  }

  @Get('structure')
  @UseGuards(PermissionsGuard) @RequirePermissions(Permission.UI_CONTROL_MANAGE)
  async structure(@CurrentUser() user: any) {
    return this.service.getStructureTree(user.companyId);
  }

  @Get('page-elements')
  @UseGuards(PermissionsGuard) @RequirePermissions(Permission.UI_CONTROL_MANAGE)
  async pageElements(@CurrentUser() user: any) {
    return this.service.getPageElements(user.companyId);
  }

  @Post('sync')
  @UseGuards(PermissionsGuard) @RequirePermissions(Permission.UI_CONTROL_MANAGE)
  async sync(@CurrentUser() user: any, @Body() dto: SyncElementsDto) {
    return this.service.syncElements(user.companyId, dto.elements, user.id);
  }

  @Post('elements')
  @UseGuards(PermissionsGuard) @RequirePermissions(Permission.UI_CONTROL_MANAGE)
  async create(@CurrentUser() user: any, @Body() dto: CreateElementDto) {
    return this.service.createElement(user.companyId, dto, user.id);
  }

  @Put('elements/reorder')
  @UseGuards(PermissionsGuard) @RequirePermissions(Permission.UI_CONTROL_MANAGE)
  async reorder(@CurrentUser() user: any, @Body() dto: ReorderElementsDto) {
    return this.service.reorderElements(dto.items, user.id);
  }

  @Put('elements/:id')
  @UseGuards(PermissionsGuard) @RequirePermissions(Permission.UI_CONTROL_MANAGE)
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateElementDto) {
    return this.service.updateElement(id, dto, user.id);
  }

  @Delete('elements/:id')
  @UseGuards(PermissionsGuard) @RequirePermissions(Permission.UI_CONTROL_MANAGE)
  async remove(@Param('id') id: string) {
    return this.service.deleteElement(id);
  }

  @Put('overrides')
  @UseGuards(PermissionsGuard) @RequirePermissions(Permission.UI_CONTROL_MANAGE)
  async bulkUpsert(@CurrentUser() user: any, @Body() dto: BulkUpsertOverridesDto) {
    return this.service.bulkUpsertOverrides(user.companyId, dto.overrides, user.id);
  }

  @Delete('overrides/:id')
  @UseGuards(PermissionsGuard) @RequirePermissions(Permission.UI_CONTROL_MANAGE)
  async removeOverride(@Param('id') id: string) {
    return this.service.deleteOverride(id);
  }
}
