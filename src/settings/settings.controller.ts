import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import {
  UpdateSystemSettingDto,
  BulkUpdateSettingsDto,
  CreateNumberingSeriesDto,
  UpdateNumberingSeriesDto,
} from './dto/settings.dto';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ─── SYSTEM SETTINGS ─────────────────────────

  @Post('system/initialize')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Initialize default system settings' })
  initializeSettings(@CurrentUser() user: any) {
    return this.settingsService.initializeDefaultSettings(user.id);
  }

  @Get('system')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiQuery({ name: 'category', required: false })
  getAllSettings(@Query('category') category?: string) {
    return this.settingsService.getAllSettings(category);
  }

  @Get('system/:key')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get a specific setting by key' })
  getSetting(@Param('key') key: string) {
    return this.settingsService.getSetting(key);
  }

  @Put('system/bulk')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Bulk update multiple settings at once' })
  bulkUpdateSettings(
    @Body() dto: BulkUpdateSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.bulkUpdateSettings(dto, user.id);
  }

  @Put('system/:key')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Update a specific setting' })
  updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSystemSettingDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updateSetting(key, dto, user.id);
  }

  // ─── NUMBERING SERIES ────────────────────────

  @Post('numbering/initialize/:companyId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Initialize default numbering series for a company' })
  initializeSeries(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.initializeDefaultSeries(companyId, user.id);
  }

  @Get('numbering')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'List all numbering series' })
  @ApiQuery({ name: 'companyId', required: false })
  getAllSeries(@Query('companyId') companyId?: string) {
    return this.settingsService.getAllSeries(companyId);
  }

  @Get('numbering/next')
  @ApiOperation({ summary: 'Get next document number' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'documentType', required: true })
  getNextNumber(
    @Query('companyId') companyId: string,
    @Query('documentType') documentType: string,
  ) {
    return this.settingsService.getNextNumber(companyId, documentType)
      .then((number) => ({ number, documentType, companyId }));
  }

  @Get('numbering/preview')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Preview next number without incrementing' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'documentType', required: true })
  previewNextNumber(
    @Query('companyId') companyId: string,
    @Query('documentType') documentType: string,
  ) {
    return this.settingsService.previewNextNumber(companyId, documentType)
      .then((number) => ({ preview: number, documentType }));
  }

  @Get('numbering/:id')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get numbering series by ID' })
  getOneSeries(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.getOneSeries(id);
  }

  @Post('numbering')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Create a new numbering series' })
  createSeries(
    @Body() dto: CreateNumberingSeriesDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.createSeries(dto, user.id);
  }

  @Put('numbering/:id')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Update numbering series config' })
  updateSeries(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNumberingSeriesDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updateSeries(id, dto, user.id);
  }
}
