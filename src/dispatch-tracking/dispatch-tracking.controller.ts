import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DispatchTrackingService } from './dispatch-tracking.service';
import { CreateTrackingUpdateDto, UpdateTrackingUpdateDto } from './dto/dispatch-tracking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatch-tracking')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchTrackingController {
  constructor(private readonly trackingService: DispatchTrackingService) {}

  @Get('gate-out/:gateOutId')
  @RequirePermissions(Permission.DISPATCH_TRACKING_VIEW)
  findTimeline(@Param('gateOutId') gateOutId: string, @Request() req: any) {
    return this.trackingService.findTimeline(gateOutId, req.user);
  }

  @Get(':id')
  @RequirePermissions(Permission.DISPATCH_TRACKING_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.trackingService.findOne(id, req.user);
  }

  @Post()
  @RequirePermissions(Permission.DISPATCH_TRACKING_CREATE)
  create(@Body() dto: CreateTrackingUpdateDto, @Request() req: any) {
    return this.trackingService.create(dto, req.user);
  }

  @Patch(':id')
  @RequirePermissions(Permission.DISPATCH_TRACKING_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateTrackingUpdateDto, @Request() req: any) {
    return this.trackingService.update(id, dto, req.user);
  }
}
