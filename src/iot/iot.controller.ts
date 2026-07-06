import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { IotService } from './iot.service';
import { CreateMachineDto, PostReadingDto, BulkReadingDto, UpdateAlertDto } from './dto/iot.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('iot')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IotController {
  constructor(private readonly iotService: IotService) {}

  @Get('dashboard')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getDashboard(@Request() req: any) { return this.iotService.getDashboard(req.user); }

  @Get('ai-insights')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getAiInsights(@Request() req: any) { return this.iotService.getAiInsights(req.user); }

  @Get('predictive')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getPredictive(@Request() req: any) { return this.iotService.getPredictiveInsights(req.user); }

  @Get('machines')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getMachines(@Request() req: any, @Query() query: any) { return this.iotService.findAllMachines(req.user, query); }

  @Get('machines/:id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getMachine(@Param('id') id: string, @Request() req: any) { return this.iotService.getMachine(id, req.user); }

  @Post('machines')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createMachine(@Body() dto: CreateMachineDto, @Request() req: any) { return this.iotService.createMachine(dto, req.user); }

  @Put('machines/:id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateMachine(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.iotService.updateMachine(id, dto, req.user); }

  @Put('machines/:id/status')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) { return this.iotService.updateMachineStatus(id, status, req.user); }

  @Post('readings')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  postReading(@Body() dto: PostReadingDto, @Request() req: any) { return this.iotService.postReading(dto, req.user); }

  @Post('readings/bulk')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  bulkReadings(@Body() dto: BulkReadingDto, @Request() req: any) { return this.iotService.bulkPostReadings(dto, req.user); }

  @Get('readings/:machineId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getReadings(@Param('machineId') id: string, @Query() query: any, @Request() req: any) { return this.iotService.getReadings(id, req.user, query); }

  @Get('alerts')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getAlerts(@Request() req: any, @Query() query: any) { return this.iotService.getAlerts(req.user, query); }

  @Put('alerts/:id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateAlert(@Param('id') id: string, @Body() dto: UpdateAlertDto, @Request() req: any) { return this.iotService.updateAlert(id, dto, req.user); }
}
