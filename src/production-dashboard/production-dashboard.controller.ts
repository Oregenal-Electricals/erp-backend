import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ProductionDashboardService } from './production-dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('production-dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductionDashboardController {
  constructor(private readonly pdService: ProductionDashboardService) {}

  @Get('overview')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getOverview(@Request() req: any) { return this.pdService.getOverview(req.user); }

  @Get('active-wos')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getActiveWos(@Request() req: any) { return this.pdService.getActiveWos(req.user); }

  @Get('today')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getToday(@Request() req: any) { return this.pdService.getToday(req.user); }

  @Get('alerts')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getAlerts(@Request() req: any) { return this.pdService.getAlerts(req.user); }

  @Get('quality')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getQuality(@Request() req: any) { return this.pdService.getQualityMetrics(req.user); }
}
