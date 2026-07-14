import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StockIssueService } from './stock-issue.service';
import { CreateStockIssueDto } from './dto/stock-issue.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('stock-issues')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockIssueController {
  constructor(private readonly siService: StockIssueService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.siService.getStats(req.user); }

  @Get('fifo-plan')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getFifoPlan(@Query() q: any, @Request() req: any) {
    return this.siService.getFifoPlan(q.warehouseId, q.itemCode, parseFloat(q.qty), q.method, req.user);
  }

  @Get()
  @RequirePermissions(Permission.STOCK_ISSUE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.siService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.siService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateStockIssueDto, @Request() req: any) { return this.siService.create(dto, req.user); }

  @Post(':id/confirm')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  confirm(@Param('id') id: string, @Request() req: any) { return this.siService.confirm(id, req.user); }
}
