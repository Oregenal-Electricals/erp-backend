import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { RtvService } from './rtv.service';
import { RequestRtvDto, DecideRtvDto, PrepareRtvDto, GateOutRtvDto } from './dto/rtv.dto';

@Controller('rtv')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RtvController {
  constructor(private service: RtvService) {}

  @Get('pending')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findPending(@Request() req: any) { return this.service.findPending(req.user); }

  @Get('ready-for-gate-out')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findReadyForGateOut(@Request() req: any) { return this.service.findReadyForGateOut(req.user); }

  @Get('rejected-item/:rejectedStockItemId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findForRejectedItem(@Param('rejectedStockItemId') id: string, @Request() req: any) { return this.service.findForRejectedItem(id, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.service.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.STORE_RTV_PREPARE)
  request(@Body() dto: RequestRtvDto, @Request() req: any) { return this.service.request(dto, req.user); }

  @Post(':id/decide')
  @RequirePermissions(Permission.PURCHASE_RTV_AUTHORIZE)
  decide(@Param('id') id: string, @Body() dto: DecideRtvDto, @Request() req: any) { return this.service.decide(id, dto, req.user); }

  @Post(':id/prepare')
  @RequirePermissions(Permission.STORE_RTV_PREPARE)
  prepare(@Param('id') id: string, @Body() dto: PrepareRtvDto, @Request() req: any) { return this.service.prepare(id, dto, req.user); }

  @Post(':id/gate-out')
  @RequirePermissions(Permission.GATE_RTV_OUT_CONFIRM)
  gateOut(@Param('id') id: string, @Body() dto: GateOutRtvDto, @Request() req: any) { return this.service.gateOut(id, dto, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.STORE_RTV_CANCEL)
  cancel(@Param('id') id: string, @Request() req: any) { return this.service.cancel(id, req.user); }
}
