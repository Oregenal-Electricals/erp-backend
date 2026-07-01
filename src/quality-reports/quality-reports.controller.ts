import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { QualityReportsService } from './quality-reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('quality-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QualityReportsController {
  constructor(private readonly qrService: QualityReportsService) {}

  @Get('ncr-report')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getNcrReport(@Request() req: any, @Query() query: any) { return this.qrService.getNcrReport(req.user, query); }

  @Get('capa-report')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getCapaReport(@Request() req: any, @Query() query: any) { return this.qrService.getCapaReport(req.user, query); }

  @Get('oqc-report')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getOqcReport(@Request() req: any, @Query() query: any) { return this.qrService.getOqcReport(req.user, query); }

  @Get('supplier-report')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getSupplierReport(@Request() req: any, @Query() query: any) { return this.qrService.getSupplierReport(req.user, query); }

  @Get('complaint-report')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getComplaintReport(@Request() req: any, @Query() query: any) { return this.qrService.getComplaintReport(req.user, query); }

  @Get('kpi-summary')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getKpiSummary(@Request() req: any) { return this.qrService.getKpiSummary(req.user); }
}
