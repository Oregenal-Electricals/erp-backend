import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('work-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkOrderController {
  constructor(private readonly woService: WorkOrderService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.woService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.woService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.woService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateWorkOrderDto, @Request() req: any) { return this.woService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto, @Request() req: any) { return this.woService.update(id, dto, req.user); }

  @Post(':id/release')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  release(@Param('id') id: string, @Request() req: any) { return this.woService.release(id, req.user); }

  @Post(':id/start')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  start(@Param('id') id: string, @Request() req: any) { return this.woService.start(id, req.user); }

  @Post(':id/complete')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  complete(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.woService.complete(id, dto, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  cancel(@Param('id') id: string, @Request() req: any) { return this.woService.cancel(id, req.user); }
}
