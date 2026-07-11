import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PriceHistoryService } from './price-history.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('price-history')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PriceHistoryController {
  constructor(private readonly priceHistoryService: PriceHistoryService) {}

  @Get('stats')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getStats(@Request() req: any) { return this.priceHistoryService.getStats(req.user); }

  @Get('search')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  search(@Request() req: any, @Query() query: any) { return this.priceHistoryService.search(req.user, query); }

  @Get('item/:itemCode')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getItemHistory(@Param('itemCode') itemCode: string, @Request() req: any) { return this.priceHistoryService.getItemHistory(itemCode, req.user); }

  @Get('effective/:itemCode')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getEffectivePrice(@Param('itemCode') itemCode: string, @Request() req: any) { return this.priceHistoryService.getEffectivePrice(itemCode, req.user); }

  @Get('list/:priceListId')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getListHistory(@Param('priceListId') priceListId: string, @Request() req: any) { return this.priceHistoryService.getListHistory(priceListId, req.user); }
}
