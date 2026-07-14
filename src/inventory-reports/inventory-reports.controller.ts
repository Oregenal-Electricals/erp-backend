import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { InventoryReportsService } from './inventory-reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('inventory-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryReportsController {
  constructor(private readonly irService: InventoryReportsService) {}

  @Get('stock-register')
  @RequirePermissions(Permission.INVENTORY_REPORT_VIEW)
  getStockRegister(@Request() req: any, @Query() query: any) { return this.irService.getStockRegister(req.user, query); }

  @Get('grn-register')
  @RequirePermissions(Permission.INVENTORY_REPORT_VIEW)
  getGrnRegister(@Request() req: any, @Query() query: any) { return this.irService.getGrnRegister(req.user, query); }

  @Get('issue-register')
  @RequirePermissions(Permission.INVENTORY_REPORT_VIEW)
  getIssueRegister(@Request() req: any, @Query() query: any) { return this.irService.getIssueRegister(req.user, query); }

  @Get('transfer-register')
  @RequirePermissions(Permission.INVENTORY_REPORT_VIEW)
  getTransferRegister(@Request() req: any, @Query() query: any) { return this.irService.getTransferRegister(req.user, query); }

  @Get('abc-analysis')
  @RequirePermissions(Permission.INVENTORY_REPORT_VIEW)
  getAbcAnalysis(@Request() req: any, @Query() query: any) { return this.irService.getAbcAnalysis(req.user, query); }
}
