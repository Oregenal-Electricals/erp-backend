import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('executive')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getExecutive(@Request() req: any) { return this.analyticsService.getExecutiveDashboard(req.user.companyId); }

  @Get('sales')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getSales(@Request() req: any) { return this.analyticsService.getSalesAnalytics(req.user.companyId); }

  @Get('purchase')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getPurchase(@Request() req: any) { return this.analyticsService.getPurchaseAnalytics(req.user.companyId); }

  @Get('inventory')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getInventory(@Request() req: any) { return this.analyticsService.getInventoryAnalytics(req.user.companyId); }

  @Get('quality')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getQuality(@Request() req: any) { return this.analyticsService.getQualityAnalytics(req.user.companyId); }

  @Get('finance-deep')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getFinanceDeep(@Request() req: any) { return this.analyticsService.getFinanceDeep(req.user.companyId); }

  @Get('quality-deep')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getQualityDeep(@Request() req: any) { return this.analyticsService.getQualityDeep(req.user.companyId); }

  @Get('production-deep')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getProductionDeep(@Request() req: any) { return this.analyticsService.getProductionDeep(req.user.companyId); }

  @Get('inventory-deep')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getInventoryDeep(@Request() req: any) { return this.analyticsService.getInventoryDeep(req.user.companyId); }

  @Get('purchase-deep')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getPurchaseDeep(@Request() req: any, @Query() query: any) { return this.analyticsService.getPurchaseDeep(req.user.companyId, query); }

  @Get('sales-deep')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getSalesDeep(@Request() req: any, @Query() query: any) { return this.analyticsService.getSalesDeep(req.user.companyId, query); }

  @Get('finance')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getFinance(@Request() req: any) { return this.analyticsService.getFinanceAnalytics(req.user.companyId); }
}
