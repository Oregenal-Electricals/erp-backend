import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { QualityDashboardService } from './quality-dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('quality-dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QualityDashboardController {
  constructor(private readonly qdService: QualityDashboardService) {}

  @Get('overview')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getOverview(@Request() req: any) { return this.qdService.getOverview(req.user); }

  @Get('ncr-summary')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getNcrSummary(@Request() req: any) { return this.qdService.getNcrSummary(req.user); }

  @Get('oqc-trend')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getOqcTrend(@Request() req: any) { return this.qdService.getOqcTrend(req.user); }

  @Get('alerts')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getAlerts(@Request() req: any) { return this.qdService.getAlerts(req.user); }
}
