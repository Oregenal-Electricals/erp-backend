import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { GateEventsService } from './gate-events.service';
import { CreateGateEventDto, CorrectGateEventDto } from './dto/gate-event.dto';

@Controller('gate-events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GateEventsController {
  constructor(private service: GateEventsService) {}

  @Post()
  @RequirePermissions(Permission.GATE_EVENT_CREATE)
  create(@Body() dto: CreateGateEventDto, @Request() req: any) { return this.service.create(dto, req.user); }

  @Get()
  @RequirePermissions(Permission.GATE_EVENT_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.service.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.GATE_EVENT_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.service.findOne(id, req.user); }

  @Post(':id/correct')
  @RequirePermissions(Permission.GATE_EVENT_CORRECT)
  correct(@Param('id') id: string, @Body() dto: CorrectGateEventDto, @Request() req: any) { return this.service.correct(id, dto, req.user); }
}
