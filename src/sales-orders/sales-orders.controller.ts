import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service';
import { CreateSoDto, CancelSoDto } from './dto/sales-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('sales-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesOrdersController {
  constructor(private readonly soService: SalesOrdersService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.soService.getStats(req.user); }

  @Get('by-cpo/:cpoId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getByCpo(@Param('cpoId') cpoId: string, @Request() req: any) { return this.soService.getByCpo(cpoId, req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.soService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.soService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateSoDto, @Request() req: any) { return this.soService.create(dto, req.user); }

  @Post(':id/confirm')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  confirm(@Param('id') id: string, @Request() req: any) { return this.soService.confirm(id, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  cancel(@Param('id') id: string, @Body() dto: CancelSoDto, @Request() req: any) { return this.soService.cancel(id, dto, req.user); }
}
