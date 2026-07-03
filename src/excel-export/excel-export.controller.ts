import { Controller, Get, Query, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { ExcelExportService } from './excel-export.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('excel')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExcelExportController {
  constructor(private readonly excelService: ExcelExportService) {}

  private send(res: Response, buffer: Buffer, filename: string) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('ar-invoices')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async arInvoices(@Request() req: any, @Query() query: any, @Res() res: Response) {
    const buffer = await this.excelService.exportArInvoices(req.user.companyId, query);
    this.send(res, buffer, `AR-Invoices-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  @Get('ap-bills')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async apBills(@Request() req: any, @Query() query: any, @Res() res: Response) {
    const buffer = await this.excelService.exportApBills(req.user.companyId, query);
    this.send(res, buffer, `AP-Bills-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  @Get('purchase-orders')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async purchaseOrders(@Request() req: any, @Query() query: any, @Res() res: Response) {
    const buffer = await this.excelService.exportPurchaseOrders(req.user.companyId, query);
    this.send(res, buffer, `Purchase-Orders-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  @Get('sales-orders')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async salesOrders(@Request() req: any, @Query() query: any, @Res() res: Response) {
    const buffer = await this.excelService.exportSalesOrders(req.user.companyId, query);
    this.send(res, buffer, `Sales-Orders-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  @Get('stock')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async stock(@Request() req: any, @Res() res: Response) {
    const buffer = await this.excelService.exportStock(req.user.companyId);
    this.send(res, buffer, `Stock-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  @Get('ncr')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async ncr(@Request() req: any, @Query() query: any, @Res() res: Response) {
    const buffer = await this.excelService.exportNcr(req.user.companyId, query);
    this.send(res, buffer, `NCR-Register-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  @Get('tasks')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async tasks(@Request() req: any, @Query() query: any, @Res() res: Response) {
    const buffer = await this.excelService.exportTasks(req.user.companyId, query);
    this.send(res, buffer, `Tasks-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  @Get('trial-balance')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  async trialBalance(@Request() req: any, @Query() query: any, @Res() res: Response) {
    const buffer = await this.excelService.exportTrialBalance(req.user.companyId, query);
    this.send(res, buffer, `Trial-Balance-${query.period || 'current'}.xlsx`);
  }
}
