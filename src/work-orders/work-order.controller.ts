import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { MaterialReservationService } from './material-reservation.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
@Controller('work-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkOrderController {
  constructor(
    private readonly woService: WorkOrderService,
    private readonly reservationService: MaterialReservationService,
  ) {}
  @Get('stats')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  getStats(@Request() req: any) { return this.woService.getStats(req.user); }
  @Get('reservations')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  getReservations(@Request() req: any, @Query() query: any) { return this.reservationService.findAll(req.user, query); }
  @Get()
  @RequirePermissions(Permission.WORK_ORDER_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.woService.findAll(req.user, query); }
  @Get(':id')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.woService.findOne(id, req.user); }
  @Get(':id/reservations')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  getWoReservations(@Param('id') id: string) { return this.reservationService.findForWorkOrder(id); }
  @Post()
  @RequirePermissions(Permission.PRODUCTION_CREATE)
  create(@Body() dto: CreateWorkOrderDto, @Request() req: any) { return this.woService.create(dto, req.user); }
  @Put(':id')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto, @Request() req: any) { return this.woService.update(id, dto, req.user); }
  @Post(':id/release')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  release(@Param('id') id: string, @Request() req: any) { return this.woService.release(id, req.user); }
  @Post(':id/start')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  start(@Param('id') id: string, @Request() req: any) { return this.woService.start(id, req.user); }
  @Post(':id/complete')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  complete(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.woService.complete(id, dto, req.user); }
  @Post(':id/cancel')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  cancel(@Param('id') id: string, @Request() req: any) { return this.woService.cancel(id, req.user); }
}
