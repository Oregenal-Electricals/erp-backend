import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { ReworkService } from './rework.service';
import { CreateReworkDto, StartReworkDto, CompleteReworkDto } from './dto/rework.dto';
@Controller('rework')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReworkController {
  constructor(private reworkService: ReworkService) {}
  @Get()
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  findAll(@Request() req: any, @Query() query: any) { return this.reworkService.findAll(req.user, query); }
  @Get(':id')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  findOne(@Param('id') id: string, @Request() req: any) { return this.reworkService.findOne(id, req.user); }
  @Post()
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  create(@Body() dto: CreateReworkDto, @Request() req: any) { return this.reworkService.create(dto, req.user); }
  @Post(':id/start')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  start(@Param('id') id: string, @Body() dto: StartReworkDto, @Request() req: any) { return this.reworkService.start(id, dto, req.user); }
  @Post(':id/complete')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  complete(@Param('id') id: string, @Body() dto: CompleteReworkDto, @Request() req: any) { return this.reworkService.complete(id, dto, req.user); }
}
