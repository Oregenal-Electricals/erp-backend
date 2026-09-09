import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ProductionReportsService } from './production-reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('production-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductionReportsController {
  constructor(private readonly prService: ProductionReportsService) {}

  @Get('wo-completion')
  @RequirePermissions(Permission.PRODUCTION_REPORT_VIEW)
  getWoCompletion(@Request() req: any, @Query() query: any) { return this.prService.getWoCompletionReport(req.user, query); }

  @Get('shift-production')
  @RequirePermissions(Permission.PRODUCTION_REPORT_VIEW)
  getShiftProduction(@Request() req: any, @Query() query: any) { return this.prService.getShiftProductionReport(req.user, query); }

  @Get('material-consumption')
  @RequirePermissions(Permission.PRODUCTION_REPORT_VIEW)
  getMaterialConsumption(@Request() req: any, @Query() query: any) { return this.prService.getMaterialConsumptionReport(req.user, query); }

  @Get('scrap-analysis')
  @RequirePermissions(Permission.PRODUCTION_REPORT_VIEW)
  getScrapAnalysis(@Request() req: any, @Query() query: any) { return this.prService.getScrapAnalysis(req.user, query); }

  @Get('quality-summary')
  @RequirePermissions(Permission.PRODUCTION_REPORT_VIEW)
  getQualitySummary(@Request() req: any, @Query() query: any) { return this.prService.getQualitySummary(req.user, query); }
  @Get('daily-output')
  @RequirePermissions(Permission.PRODUCTION_REPORT_VIEW)
  getDailyOutput(@Request() req: any, @Query() query: any) { return this.prService.getDailyOutputByProduct(req.user, query); }
  @Get('oee')
  @RequirePermissions(Permission.PRODUCTION_REPORT_VIEW)
  getOee(@Request() req: any, @Query() query: any) { return this.prService.getOeeReport(req.user, query); }
  @Get('cost-trend')
  @RequirePermissions(Permission.PRODUCTION_REPORT_VIEW)
  getCostTrend(@Request() req: any, @Query() query: any) { return this.prService.getCostTrend(req.user, query); }
  @Get('pnl')
  @RequirePermissions(Permission.PRODUCTION_REPORT_VIEW)
  getPnl(@Request() req: any, @Query() query: any) { return this.prService.getPnl(req.user, query); }
}
