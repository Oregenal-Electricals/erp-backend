import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StockLedgerService } from './stock-ledger.service';
import { AdjustStockDto } from './dto/stock-ledger.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('stock-ledger')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockLedgerController {
  constructor(private readonly slService: StockLedgerService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.slService.getStats(req.user); }

  @Get('balance')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findBalance(@Request() req: any, @Query() query: any) { return this.slService.findBalance(req.user, query); }

  @Get('item/:code')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getItemLedger(@Param('code') code: string, @Request() req: any) { return this.slService.getItemLedger(code, req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findLedger(@Request() req: any, @Query() query: any) { return this.slService.findLedger(req.user, query); }

  @Post('receive/:iqcId')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  receiveFromIqc(@Param('iqcId') iqcId: string, @Request() req: any) { return this.slService.receiveFromIqc(iqcId, req.user); }

  @Post('adjust')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  adjust(@Body() dto: AdjustStockDto, @Request() req: any) { return this.slService.adjust(dto, req.user); }
}
