import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { HrReportsService } from './hr-reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('hr-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HrReportsController {
  constructor(private readonly hrReportsService: HrReportsService) {}

  @Get('headcount')
  @RequirePermissions(Permission.HR_VIEW)
  getHeadcount(@Request() req: any) { return this.hrReportsService.getHeadcountReport(req.user.companyId); }

  @Get('attendance-summary')
  @RequirePermissions(Permission.HR_VIEW)
  getAttendance(@Query('month') month: string, @Query('year') year: string, @Request() req: any) {
    return this.hrReportsService.getAttendanceSummaryReport(req.user.companyId, Number(month) || new Date().getMonth()+1, Number(year) || new Date().getFullYear());
  }

  @Get('leave-utilization')
  @RequirePermissions(Permission.HR_VIEW)
  getLeave(@Query('year') year: string, @Request() req: any) {
    return this.hrReportsService.getLeaveUtilizationReport(req.user.companyId, Number(year) || new Date().getFullYear());
  }

  @Get('payroll-cost')
  @RequirePermissions(Permission.HR_VIEW)
  getPayroll(@Query('month') month: string, @Query('year') year: string, @Request() req: any) {
    return this.hrReportsService.getPayrollCostReport(req.user.companyId, Number(month) || new Date().getMonth()+1, Number(year) || new Date().getFullYear());
  }

  @Get('attrition')
  @RequirePermissions(Permission.HR_VIEW)
  getAttrition(@Query('year') year: string, @Request() req: any) {
    return this.hrReportsService.getAttritionReport(req.user.companyId, Number(year) || new Date().getFullYear());
  }

  @Get('ot-report')
  @RequirePermissions(Permission.HR_VIEW)
  getOt(@Query('month') month: string, @Query('year') year: string, @Request() req: any) {
    return this.hrReportsService.getOtReport(req.user.companyId, Number(month) || new Date().getMonth()+1, Number(year) || new Date().getFullYear());
  }
}
