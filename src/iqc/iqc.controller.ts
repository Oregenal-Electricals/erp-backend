import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { IqcService } from './iqc.service';
import { CreateIqcDto, UpdateIqcItemsDto } from './dto/iqc.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('iqc')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IqcController {
  constructor(private readonly iqcService: IqcService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.iqcService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.iqcService.findAll(req.user, query); }

  @Get('grn/:grnId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findByGrn(@Param('grnId') grnId: string, @Request() req: any) { return this.iqcService.findByGrn(grnId, req.user); }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.iqcService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateIqcDto, @Request() req: any) { return this.iqcService.create(dto, req.user); }

  @Put(':id/items')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateItems(@Param('id') id: string, @Body() dto: UpdateIqcItemsDto, @Request() req: any) { return this.iqcService.updateItems(id, dto, req.user); }

  @Post(':id/approve')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  approve(@Param('id') id: string, @Request() req: any) { return this.iqcService.approve(id, req.user); }
}
