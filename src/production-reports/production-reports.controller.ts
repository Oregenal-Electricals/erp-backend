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
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getWoCompletion(@Request() req: any, @Query() query: any) { return this.prService.getWoCompletionReport(req.user, query); }

  @Get('shift-production')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getShiftProduction(@Request() req: any, @Query() query: any) { return this.prService.getShiftProductionReport(req.user, query); }

  @Get('material-consumption')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getMaterialConsumption(@Request() req: any, @Query() query: any) { return this.prService.getMaterialConsumptionReport(req.user, query); }

  @Get('scrap-analysis')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getScrapAnalysis(@Request() req: any, @Query() query: any) { return this.prService.getScrapAnalysis(req.user, query); }

  @Get('quality-summary')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getQualitySummary(@Request() req: any, @Query() query: any) { return this.prService.getQualitySummary(req.user, query); }
}
