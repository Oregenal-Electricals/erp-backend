import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertTemplateDto, UpdateAlertTemplateDto, TriggerAlertDto } from './dto/alert.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('alerts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.alertsService.getStats(req.user); }

  @Get('templates')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAllTemplates(@Request() req: any) { return this.alertsService.findAllTemplates(req.user); }

  @Get('logs')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAllLogs(@Request() req: any, @Query() query: any) { return this.alertsService.findAllLogs(req.user, query); }

  @Post('seed')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  seed(@Request() req: any) { return this.alertsService.seedDefaultTemplates(req.user.companyId, req.user.id); }

  @Post('trigger')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  trigger(@Body() dto: TriggerAlertDto, @Request() req: any) { return this.alertsService.trigger(dto, req.user.companyId, req.user.id); }

  @Post('templates')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createTemplate(@Body() dto: CreateAlertTemplateDto, @Request() req: any) { return this.alertsService.createTemplate(dto, req.user); }

  @Put('templates/:id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateAlertTemplateDto, @Request() req: any) { return this.alertsService.updateTemplate(id, dto, req.user); }
}
