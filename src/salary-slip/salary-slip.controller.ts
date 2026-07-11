import { Controller, Get, Param, Query, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { SalarySlipService } from './salary-slip.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('salary-slip')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalarySlipController {
  constructor(private readonly slipService: SalarySlipService) {}

  @Get('history/:employeeId')
  @RequirePermissions(Permission.HR_VIEW)
  getHistory(@Param('employeeId') empId: string, @Request() req: any) {
    return this.slipService.getSlipHistory(req.user.companyId, empId);
  }

  @Get('download/:employeeId')
  @RequirePermissions(Permission.HR_VIEW)
  async downloadSlip(
    @Param('employeeId') empId: string,
    @Query('month') month: string,
    @Query('year') year: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const pdf = await this.slipService.generateSlip(empId, Number(month), Number(year), req.user.companyId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="salary-slip-${empId}-${month}-${year}.pdf"`);
    res.send(pdf);
  }

  @Get('bulk/:payrollRunId')
  @RequirePermissions(Permission.HR_VIEW)
  async downloadBulk(
    @Param('payrollRunId') runId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const pdf = await this.slipService.generateBulkSlips(runId, req.user.companyId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="salary-slips-${runId}.pdf"`);
    res.send(pdf);
  }
}
