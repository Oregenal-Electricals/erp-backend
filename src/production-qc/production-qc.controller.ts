import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductionQcService } from './production-qc.service';
import { CreateProductionQcDto, CompleteQcDto } from './dto/production-qc.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('production-qc')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductionQcController {
  constructor(private readonly pqcService: ProductionQcService) {}

  @Get('stats')
  @RequirePermissions(Permission.QUALITY_VIEW)
  getStats(@Request() req: any) { return this.pqcService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.QUALITY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.pqcService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.QUALITY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.pqcService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.QUALITY_CREATE)
  create(@Body() dto: CreateProductionQcDto, @Request() req: any) { return this.pqcService.create(dto, req.user); }

  @Post(':id/complete')
  @RequirePermissions(Permission.QUALITY_EDIT)
  complete(@Param('id') id: string, @Body() dto: CompleteQcDto, @Request() req: any) { return this.pqcService.complete(id, dto, req.user); }
}
