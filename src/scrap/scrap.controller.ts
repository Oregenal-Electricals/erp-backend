import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { ScrapService } from './scrap.service';
import { CreateScrapDto, DispositionScrapDto } from './dto/scrap.dto';
@Controller('scrap')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScrapController {
  constructor(private scrapService: ScrapService) {}
  @Get()
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  findAll(@Request() req: any, @Query() query: any) { return this.scrapService.findAll(req.user, query); }
  @Get(':id')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  findOne(@Param('id') id: string, @Request() req: any) { return this.scrapService.findOne(id, req.user); }
  @Post()
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  create(@Body() dto: CreateScrapDto, @Request() req: any) { return this.scrapService.create(dto, req.user); }
  @Post(':id/disposition')
  @RequirePermissions(Permission.PRODUCTION_EDIT)
  disposition(@Param('id') id: string, @Body() dto: DispositionScrapDto, @Request() req: any) { return this.scrapService.disposition(id, dto, req.user); }
}
