import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StockTransferService } from './stock-transfer.service';
import { CreateTransferDto } from './dto/stock-transfer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('stock-transfers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockTransferController {
  constructor(private readonly stService: StockTransferService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.stService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.STOCK_TRANSFER_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.stService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.stService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateTransferDto, @Request() req: any) { return this.stService.create(dto, req.user); }

  @Post(':id/confirm')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  confirm(@Param('id') id: string, @Request() req: any) { return this.stService.confirm(id, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  cancel(@Param('id') id: string, @Request() req: any) { return this.stService.cancel(id, req.user); }
}
