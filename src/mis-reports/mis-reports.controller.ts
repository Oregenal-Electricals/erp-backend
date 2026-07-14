import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { MisReportsService } from './mis-reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('mis-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MisReportsController {
  constructor(private readonly misService: MisReportsService) {}

  @Get('sales-summary')
  @RequirePermissions(Permission.MIS_REPORT_VIEW)
  getSalesSummary(@Request() req: any, @Query() query: any) { return this.misService.getSalesSummary(req.user.companyId, query); }

  @Get('purchase-summary')
  @RequirePermissions(Permission.MIS_REPORT_VIEW)
  getPurchaseSummary(@Request() req: any, @Query() query: any) { return this.misService.getPurchaseSummary(req.user.companyId, query); }

  @Get('stock-position')
  @RequirePermissions(Permission.MIS_REPORT_VIEW)
  getStockPosition(@Request() req: any, @Query() query: any) { return this.misService.getStockPosition(req.user.companyId, query); }

  @Get('outstanding-ar')
  @RequirePermissions(Permission.MIS_REPORT_VIEW)
  getOutstandingAr(@Request() req: any, @Query() query: any) { return this.misService.getOutstandingAr(req.user.companyId, query); }

  @Get('outstanding-ap')
  @RequirePermissions(Permission.MIS_REPORT_VIEW)
  getOutstandingAp(@Request() req: any, @Query() query: any) { return this.misService.getOutstandingAp(req.user.companyId, query); }

  @Get('ncr-summary')
  @RequirePermissions(Permission.MIS_REPORT_VIEW)
  getNcrSummary(@Request() req: any, @Query() query: any) { return this.misService.getNcrSummary(req.user.companyId, query); }

  @Get('production-summary')
  @RequirePermissions(Permission.MIS_REPORT_VIEW)
  getProductionSummary(@Request() req: any, @Query() query: any) { return this.misService.getProductionSummary(req.user.companyId, query); }

  @Get('gst-summary')
  @RequirePermissions(Permission.MIS_REPORT_VIEW)
  getGstSummary(@Request() req: any, @Query() query: any) { return this.misService.getGstSummary(req.user.companyId, query); }
}
