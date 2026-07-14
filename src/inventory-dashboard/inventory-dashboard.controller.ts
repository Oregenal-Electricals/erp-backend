import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { InventoryDashboardService } from './inventory-dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('inventory-dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryDashboardController {
  constructor(private readonly idService: InventoryDashboardService) {}

  @Get('overview')
  @RequirePermissions(Permission.INVENTORY_DASHBOARD_VIEW)
  getOverview(@Request() req: any) { return this.idService.getOverview(req.user); }

  @Get('alerts')
  @RequirePermissions(Permission.INVENTORY_DASHBOARD_VIEW)
  getAlerts(@Request() req: any) { return this.idService.getAlerts(req.user); }

  @Get('activity')
  @RequirePermissions(Permission.INVENTORY_DASHBOARD_VIEW)
  getActivity(@Request() req: any) { return this.idService.getActivity(req.user); }

  @Get('top-items')
  @RequirePermissions(Permission.INVENTORY_DASHBOARD_VIEW)
  getTopItems(@Request() req: any) { return this.idService.getTopItems(req.user); }
}
