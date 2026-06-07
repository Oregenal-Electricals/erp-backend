import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { HsnSacService } from './hsn-sac.service';
import { CreateHsnSacDto, UpdateHsnSacDto } from './dto/hsn-sac.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('hsn-sac')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HsnSacController {
  constructor(private readonly hsnSacService: HsnSacService) {}

  @Get('stats')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  getStats(@Request() req: any) { return this.hsnSacService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.SETTINGS_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.hsnSacService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.hsnSacService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  create(@Body() dto: CreateHsnSacDto, @Request() req: any) { return this.hsnSacService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateHsnSacDto, @Request() req: any) { return this.hsnSacService.update(id, dto, req.user); }

  @Delete(':id')
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  remove(@Param('id') id: string, @Request() req: any) { return this.hsnSacService.remove(id, req.user); }
}
