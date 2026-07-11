import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { LandedCostService } from './landed-cost.service';
import { CreateLandedCostDto, UpdateLandedCostDto } from './dto/landed-cost.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('landed-costs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LandedCostController {
  constructor(private readonly lcService: LandedCostService) {}

  @Get('stats')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  getStats(@Request() req: any) { return this.lcService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.lcService.findAll(req.user, query); }

  @Get('ipo/:ipoId')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findByIpo(@Param('ipoId') ipoId: string, @Request() req: any) { return this.lcService.findByIpo(ipoId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.PURCHASE_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.lcService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.PURCHASE_CREATE)
  create(@Body() dto: CreateLandedCostDto, @Request() req: any) { return this.lcService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateLandedCostDto, @Request() req: any) { return this.lcService.update(id, dto, req.user); }

  @Post(':id/calculate')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  calculate(@Param('id') id: string, @Request() req: any) { return this.lcService.calculate(id, req.user); }

  @Post(':id/finalize')
  @RequirePermissions(Permission.PURCHASE_EDIT)
  finalize(@Param('id') id: string, @Request() req: any) { return this.lcService.finalize(id, req.user); }
}
