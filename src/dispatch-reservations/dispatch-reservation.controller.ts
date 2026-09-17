import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DispatchReservationService } from './dispatch-reservation.service';
import { CreateReservationDto, ReleaseReservationDto } from './dto/dispatch-reservation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatch-reservations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchReservationController {
  constructor(private readonly drService: DispatchReservationService) {}

  @Get('by-plan-item/:dispatchPlanItemId')
  @RequirePermissions(Permission.DISPATCH_RESERVATION_VIEW)
  findByPlanItem(@Param('dispatchPlanItemId') dispatchPlanItemId: string, @Request() req: any) {
    return this.drService.findByPlanItem(dispatchPlanItemId, req.user);
  }

  @Get(':reservationNumber')
  @RequirePermissions(Permission.DISPATCH_RESERVATION_VIEW)
  findOne(@Param('reservationNumber') reservationNumber: string, @Request() req: any) {
    return this.drService.findOne(reservationNumber, req.user);
  }

  @Post()
  @RequirePermissions(Permission.DISPATCH_RESERVATION_CREATE)
  reserve(@Body() dto: CreateReservationDto, @Request() req: any) {
    return this.drService.reserve(dto.dispatchPlanItemId, dto.requestedQty, req.user);
  }

  @Post(':reservationNumber/release')
  @RequirePermissions(Permission.DISPATCH_RESERVATION_RELEASE)
  release(@Param('reservationNumber') reservationNumber: string, @Body() dto: ReleaseReservationDto, @Request() req: any) {
    return this.drService.release(reservationNumber, dto.releaseQty, dto.reason, req.user);
  }
}
