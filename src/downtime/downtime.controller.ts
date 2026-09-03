import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { DowntimeService } from './downtime.service';
import { PauseDto, ResumeDto } from './dto/downtime.dto';
@Controller('downtimes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DowntimeController {
  constructor(private downtimeService: DowntimeService) {}
  @Get()
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  findAll(@Request() req: any, @Query() query: any) { return this.downtimeService.findAll(req.user, query); }
  @Get('work-order/:workOrderId/cumulative')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  getCumulative(@Param('workOrderId') workOrderId: string, @Request() req: any) { return this.downtimeService.getCumulativeDowntime(workOrderId, req.user); }
  @Post('pause')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  pause(@Body() dto: PauseDto, @Request() req: any) { return this.downtimeService.pause(dto, req.user); }
  @Post(':id/resume')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  resume(@Param('id') id: string, @Body() dto: ResumeDto, @Request() req: any) { return this.downtimeService.resume(id, dto, req.user); }
}
