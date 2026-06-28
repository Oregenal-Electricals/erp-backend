import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StockReportsService } from './stock-reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('stock-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockReportsController {
  constructor(private readonly srService: StockReportsService) {}

  @Get('ledger')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getLedger(@Request() req: any, @Query() query: any) { return this.srService.getLedger(req.user, query); }

  @Get('balance-summary')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getBalanceSummary(@Request() req: any, @Query() query: any) { return this.srService.getBalanceSummary(req.user, query); }

  @Get('item-card/:itemCode')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getItemCard(@Param('itemCode') itemCode: string, @Request() req: any, @Query() query: any) { return this.srService.getItemCard(itemCode, req.user, query); }

  @Get('batch-movements')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getBatchMovements(@Request() req: any, @Query() query: any) { return this.srService.getBatchMovements(req.user, query); }

  @Get('consumption')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getConsumption(@Request() req: any, @Query() query: any) { return this.srService.getConsumptionReport(req.user, query); }
}
