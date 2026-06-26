import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { PurchaseAnalyticsService } from './purchase-analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('purchase-analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchaseAnalyticsController {
  constructor(private readonly analyticsService: PurchaseAnalyticsService) {}

  @Get('overview')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getOverview(@Request() req: any) { return this.analyticsService.getOverview(req.user); }

  @Get('spend-by-vendor')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getSpendByVendor(@Request() req: any, @Query('limit') limit?: string) { return this.analyticsService.getSpendByVendor(req.user, limit ? parseInt(limit) : 10); }

  @Get('spend-by-month')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getSpendByMonth(@Request() req: any) { return this.analyticsService.getSpendByMonth(req.user); }

  @Get('po-status')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getPoStatusDistribution(@Request() req: any) { return this.analyticsService.getPoStatusDistribution(req.user); }

  @Get('pr-to-po-time')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getPrToPoTime(@Request() req: any) { return this.analyticsService.getPrToPoTime(req.user); }

  @Get('rfq-conversion')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getRfqConversion(@Request() req: any) { return this.analyticsService.getRfqConversion(req.user); }

  @Get('top-items')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getTopItems(@Request() req: any, @Query('limit') limit?: string) { return this.analyticsService.getTopItems(req.user, limit ? parseInt(limit) : 10); }
}
