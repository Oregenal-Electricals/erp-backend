import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DispatchGateOutService } from './dispatch-gate-out.service';
import { ConfirmGateOutDto } from './dto/dispatch-gate-out.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatch-gate-out')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchGateOutController {
  constructor(private readonly gateOutService: DispatchGateOutService) {}

  @Get(':id')
  @RequirePermissions(Permission.GATE_DISPATCH_OUT_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.gateOutService.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.GATE_DISPATCH_OUT_CONFIRM)
  confirmGateOut(@Body() dto: ConfirmGateOutDto, @Request() req: any) {
    return this.gateOutService.confirmGateOut(dto.dispatchConfirmationId, dto.actualVehicleNumber, req.user);
  }
}
