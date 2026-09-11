import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { HoldStockService } from './hold-stock.service';
import { ReinspectDto } from './dto/hold-stock.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('hold-stock')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HoldStockController {
  constructor(private readonly hsService: HoldStockService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.hsService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.hsService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.hsService.findOne(id, req.user); }

  @Post('from-iqc/:iqcId')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createFromIqc(@Param('iqcId') iqcId: string, @Request() req: any) { return this.hsService.createFromIqc(iqcId, req.user); }

  // Quality-only: Store never self-releases hold material (STORE-008
  // section 43). Gated by QUALITY_EDIT, the same permission that already
  // gates the normal IQC approve()/updateItems() decisions.
  @Post(':id/items/:itemId/reinspect')
  @RequirePermissions(Permission.QUALITY_EDIT)
  reinspect(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: ReinspectDto, @Request() req: any) { return this.hsService.reinspect(id, itemId, dto, req.user); }
}
