import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { FinancialReportsService } from './financial-reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('financial-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinancialReportsController {
  constructor(private readonly frService: FinancialReportsService) {}

  @Get('summary')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getSummary(@Request() req: any) { return this.frService.getSummary(req.user); }

  @Get('trial-balance')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getTrialBalance(@Request() req: any, @Query() query: any) { return this.frService.getTrialBalance(req.user, query); }

  @Get('profit-and-loss')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getProfitAndLoss(@Request() req: any, @Query() query: any) { return this.frService.getProfitAndLoss(req.user, query); }

  @Get('balance-sheet')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getBalanceSheet(@Request() req: any, @Query() query: any) { return this.frService.getBalanceSheet(req.user, query); }

  @Get('cash-flow')
  @RequirePermissions(Permission.FINANCE_VIEW)
  getCashFlow(@Request() req: any, @Query() query: any) { return this.frService.getCashFlow(req.user, query); }
}
