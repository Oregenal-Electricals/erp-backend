import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RcaService } from './rca.service';
import { CreateRcaDto, UpdateRcaDto } from './dto/rca.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('rca')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RcaController {
  constructor(private readonly rcaService: RcaService) {}

  @Get('stats')
  @RequirePermissions(Permission.QUALITY_VIEW)
  getStats(@Request() req: any) { return this.rcaService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.QUALITY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.rcaService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.QUALITY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.rcaService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.QUALITY_CREATE)
  create(@Body() dto: CreateRcaDto, @Request() req: any) { return this.rcaService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.QUALITY_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateRcaDto, @Request() req: any) { return this.rcaService.update(id, dto, req.user); }

  @Post(':id/complete')
  @RequirePermissions(Permission.QUALITY_EDIT)
  complete(@Param('id') id: string, @Request() req: any) { return this.rcaService.complete(id, req.user); }
}
