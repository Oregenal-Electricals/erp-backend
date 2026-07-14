import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StockBatchService } from './stock-batch.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/stock-batch.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('stock-batches')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockBatchController {
  constructor(private readonly sbService: StockBatchService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.sbService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.STOCK_BATCH_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.sbService.findAll(req.user, query); }

  @Get('item/:itemCode')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findByItem(@Param('itemCode') itemCode: string, @Request() req: any) { return this.sbService.findByItem(itemCode, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.sbService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateBatchDto, @Request() req: any) { return this.sbService.create(dto, req.user); }

  @Post('from-grn/:grnId')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createFromGrn(@Param('grnId') grnId: string, @Request() req: any) { return this.sbService.createFromGrn(grnId, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateBatchDto, @Request() req: any) { return this.sbService.update(id, dto, req.user); }

  @Post(':id/quarantine')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  quarantine(@Param('id') id: string, @Request() req: any) { return this.sbService.quarantine(id, req.user); }
}
