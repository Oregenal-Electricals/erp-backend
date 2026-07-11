import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DispatchPlanningService } from './dispatch-planning.service';
import { CreateDispatchPlanDto, CancelPlanDto } from './dto/dispatch-plan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('dispatch-plans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchPlanningController {
  constructor(private readonly dpService: DispatchPlanningService) {}

  @Get('stats')
  @RequirePermissions(Permission.SALES_VIEW)
  getStats(@Request() req: any) { return this.dpService.getStats(req.user); }

  @Get('pending-so-items/:soId')
  @RequirePermissions(Permission.SALES_VIEW)
  getPendingSoItems(@Param('soId') soId: string, @Request() req: any) { return this.dpService.getPendingSoItems(soId, req.user); }

  @Get()
  @RequirePermissions(Permission.SALES_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.dpService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.dpService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  create(@Body() dto: CreateDispatchPlanDto, @Request() req: any) { return this.dpService.create(dto, req.user); }

  @Post(':id/approve')
  @RequirePermissions(Permission.SALES_APPROVE)
  approve(@Param('id') id: string, @Request() req: any) { return this.dpService.approve(id, req.user); }

  @Post(':id/cancel')
  @RequirePermissions(Permission.SALES_EDIT)
  cancel(@Param('id') id: string, @Body() dto: CancelPlanDto, @Request() req: any) { return this.dpService.cancel(id, dto, req.user); }
}
