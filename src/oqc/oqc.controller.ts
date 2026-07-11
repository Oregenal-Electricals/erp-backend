import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OqcService } from './oqc.service';
import { CreateOqcDto, CompleteOqcDto } from './dto/oqc.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('oqc')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OqcController {
  constructor(private readonly oqcService: OqcService) {}

  @Get('stats')
  @RequirePermissions(Permission.QUALITY_VIEW)
  getStats(@Request() req: any) { return this.oqcService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.QUALITY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.oqcService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.QUALITY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.oqcService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.QUALITY_CREATE)
  create(@Body() dto: CreateOqcDto, @Request() req: any) { return this.oqcService.create(dto, req.user); }

  @Post(':id/complete')
  @RequirePermissions(Permission.QUALITY_EDIT)
  complete(@Param('id') id: string, @Body() dto: CompleteOqcDto, @Request() req: any) { return this.oqcService.complete(id, dto, req.user); }

  @Post(':id/release')
  @RequirePermissions(Permission.QUALITY_EDIT)
  release(@Param('id') id: string, @Request() req: any) { return this.oqcService.release(id, req.user); }
}
