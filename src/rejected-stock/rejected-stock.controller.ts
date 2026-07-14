import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RejectedStockService } from './rejected-stock.service';
import { DisposeItemDto } from './dto/rejected-stock.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('rejected-stock')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RejectedStockController {
  constructor(private readonly rsService: RejectedStockService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.rsService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.REJECTED_STOCK_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.rsService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.rsService.findOne(id, req.user); }

  @Post('from-iqc/:iqcId')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createFromIqc(@Param('iqcId') iqcId: string, @Request() req: any) { return this.rsService.createFromIqc(iqcId, req.user); }

  @Put(':id/items/:itemId/dispose')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  disposeItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: DisposeItemDto, @Request() req: any) { return this.rsService.disposeItem(id, itemId, dto, req.user); }

  @Post(':id/close')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  close(@Param('id') id: string, @Request() req: any) { return this.rsService.close(id, req.user); }
}
