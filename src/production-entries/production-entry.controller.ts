import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductionEntryService } from './production-entry.service';
import { CreateProductionEntryDto } from './dto/production-entry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('production-entries')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductionEntryController {
  constructor(private readonly peService: ProductionEntryService) {}

  @Get('stats')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  getStats(@Request() req: any) { return this.peService.getStats(req.user); }

  @Get('wo-progress/:woId')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  getWoProgress(@Param('woId') woId: string, @Request() req: any) { return this.peService.getWoProgress(woId, req.user); }

  @Get()
  @RequirePermissions(Permission.PRODUCTION_ENTRY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.peService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.PRODUCTION_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.peService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.PRODUCTION_CREATE)
  create(@Body() dto: CreateProductionEntryDto, @Request() req: any) { return this.peService.create(dto, req.user); }

  @Post(':id/confirm')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  confirm(@Param('id') id: string, @Request() req: any) { return this.peService.confirm(id, req.user); }
}
