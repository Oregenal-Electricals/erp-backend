import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { StockLocationTransferService } from './stock-location-transfer.service';
import { TransferLocationDto } from './dto/stock-location-transfer.dto';

@Controller('stock-location-transfer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockLocationTransferController {
  constructor(private service: StockLocationTransferService) {}

  @Get('history')
  @RequirePermissions(Permission.STORE_LOCATION_TRANSFER_VIEW)
  findHistory(@Query('itemCode') itemCode: string, @Request() req: any) {
    return this.service.findHistory(req.user, itemCode);
  }

  @Get('bin/:binId')
  @RequirePermissions(Permission.STORE_LOCATION_TRANSFER_VIEW)
  getBinContents(@Param('binId') binId: string, @Request() req: any) {
    return this.service.getBinContents(binId, req.user);
  }

  @Get('item/:itemCode')
  @RequirePermissions(Permission.STORE_LOCATION_TRANSFER_VIEW)
  getItemLocations(@Param('itemCode') itemCode: string, @Request() req: any) {
    return this.service.getItemLocations(itemCode, req.user);
  }

  @Post()
  @RequirePermissions(Permission.STORE_LOCATION_TRANSFER_EXECUTE)
  transfer(@Body() dto: TransferLocationDto, @Request() req: any) {
    return this.service.transfer(dto, req.user);
  }
}
