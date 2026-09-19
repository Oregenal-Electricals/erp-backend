import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { DispatchReconciliationService } from './dispatch-reconciliation.service';
import { DispatchTraceService } from './dispatch-trace.service';
import { DispatchDashboardService } from './dispatch-dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatch-reconciliation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchReconciliationController {
  constructor(
    private readonly reconciliation: DispatchReconciliationService,
    private readonly traceService: DispatchTraceService,
    private readonly dashboard: DispatchDashboardService,
  ) {}

  @Get('dashboard')
  @RequirePermissions(Permission.DISPATCH_DASHBOARD_VIEW)
  getDashboard(@Request() req: any) {
    return this.dashboard.getDashboard(req.user);
  }

  @Get('plan/:planId')
  @RequirePermissions(Permission.DISPATCH_RECONCILIATION_VIEW)
  reconcilePlan(@Param('planId') planId: string, @Request() req: any) {
    return this.reconciliation.reconcilePlan(planId, req.user);
  }

  @Get('sales-order/:soId')
  @RequirePermissions(Permission.DISPATCH_RECONCILIATION_VIEW)
  reconcileSalesOrder(@Param('soId') soId: string, @Request() req: any) {
    return this.reconciliation.reconcileSalesOrder(soId, req.user);
  }

  @Get('sfg-stage/:workOrderId')
  @RequirePermissions(Permission.DISPATCH_RECONCILIATION_VIEW)
  reconcileSfgStage(@Param('workOrderId') workOrderId: string, @Request() req: any) {
    return this.reconciliation.reconcileSfgStage(workOrderId, req.user);
  }

  @Get('gate-out/:gateOutId/consistency')
  @RequirePermissions(Permission.DISPATCH_RECONCILIATION_RUN)
  checkConsistency(@Param('gateOutId') gateOutId: string, @Request() req: any) {
    return this.reconciliation.checkCriticalConsistency(gateOutId, req.user);
  }

  @Get('trace')
  @RequirePermissions(Permission.DISPATCH_TRACE_VIEW)
  trace(@Query('packageNumber') packageNumber: string, @Query('gateOutNumber') gateOutNumber: string, @Query('soNumber') soNumber: string, @Request() req: any) {
    return this.traceService.trace({ packageNumber, gateOutNumber, soNumber }, req.user);
  }
}
