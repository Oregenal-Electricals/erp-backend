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
  @RequirePermissions(Permission.SALES_VIEW)
  getStats(@Request() req: any) { return this.soService.getStats(req.user); }

  @Get('by-cpo/:cpoId')
  @RequirePermissions(Permission.SALES_VIEW)
  getByCpo(@Param('cpoId') cpoId: string, @Request() req: any) { return this.soService.getByCpo(cpoId, req.user); }

  @Get()
  @RequirePermissions(Permission.SALES_ORDER_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.soService.findAll(req.user, query); }


  @Get('saleable-stages/:itemCode')
  @RequirePermissions(Permission.SALES_VIEW)
  getSaleableStages(@Param('itemCode') itemCode: string, @Request() req: any) { return this.soService.getSaleableStages(itemCode, req.user); }

  @Get('dispatch-ready')
  @RequirePermissions(Permission.DISPATCH_VIEW)
  getDispatchReadyLines(@Request() req: any, @Query() query: any) { return this.soService.getDispatchReadyLines(req.user, query); }
  @Get('items/:soItemId/source')
  @RequirePermissions(Permission.DISPATCH_SOURCE_VIEW)
  getSourceDetail(@Param('soItemId') soItemId: string, @Request() req: any) { return this.soService.getSourceDetail(soItemId, req.user); }

  @Get('items/:soItemId/availability')
  @RequirePermissions(Permission.DISPATCH_AVAILABILITY_VIEW)
  checkAvailability(@Param('soItemId') soItemId: string, @Request() req: any) { return this.soService.checkAvailability(soItemId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.soService.findOne(id, req.user); }

  @Get(':id/pending-deliveries')
  @RequirePermissions(Permission.SALES_VIEW)
  getPendingDeliveries(@Param('id') id: string, @Request() req: any) { return this.soService.getPendingDeliveries(id, req.user); }

  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  create(@Body() dto: CreateSoDto, @Request() req: any) { return this.soService.create(dto, req.user); }

  @Post(':id/confirm')
  @RequirePermissions(Permission.SALES_EDIT)
  confirm(@Param('id') id: string, @Request() req: any) { return this.soService.confirm(id, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.SALES_EDIT)
  cancel(@Param('id') id: string, @Body() dto: CancelSoDto, @Request() req: any) { return this.soService.cancel(id, dto, req.user); }

  // Release for Dispatch now happens automatically (SO confirm for RM
  // lines, Work Order creation for FG/SFG lines - see
  // SalesOrdersService.confirm()/tryAutoRelease() and
  // MrpService.runAllocation()). This endpoint stays only as a manual
  // retry for a line whose automatic attempt failed (see
  // sourceInvalidReason on the line) - no longer a routine Sales gate.
  @Post('items/:soItemId/release-for-dispatch')
  @RequirePermissions(Permission.SALES_ORDER_RELEASE_DISPATCH)
  releaseLineForDispatch(@Param('soItemId') soItemId: string, @Request() req: any) { return this.soService.releaseLineForDispatch(soItemId, req.user); }
}
