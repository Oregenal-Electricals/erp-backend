import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RackBinService } from './rack-bin.service';
import { CreateZoneDto, CreateRackDto, CreateBinDto, BulkCreateBinsDto, UpdateBinStatusDto } from './dto/rack-bin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('rack-bin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RackBinController {
  constructor(private readonly rbService: RackBinService) {}

  @Get('stats/:warehouseId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Param('warehouseId') wId: string, @Request() req: any) { return this.rbService.getWarehouseStats(wId, req.user); }

  @Get('zones/:warehouseId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findZones(@Param('warehouseId') wId: string, @Request() req: any) { return this.rbService.findZones(wId, req.user); }

  @Post('zones')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createZone(@Body() dto: CreateZoneDto, @Request() req: any) { return this.rbService.createZone(dto, req.user); }

  @Get('racks/:warehouseId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findRacks(@Param('warehouseId') wId: string, @Request() req: any, @Query('zoneId') zoneId?: string) { return this.rbService.findRacks(wId, req.user, zoneId); }

  @Post('racks')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createRack(@Body() dto: CreateRackDto, @Request() req: any) { return this.rbService.createRack(dto, req.user); }

  @Get('bins/rack/:rackId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findBins(@Param('rackId') rackId: string, @Request() req: any) { return this.rbService.findBins(rackId, req.user); }

  @Get('bins/empty/:warehouseId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  findEmptyBins(@Param('warehouseId') wId: string, @Request() req: any) { return this.rbService.findEmptyBins(wId, req.user); }

  @Post('bins')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createBin(@Body() dto: CreateBinDto, @Request() req: any) { return this.rbService.createBin(dto, req.user); }

  @Post('bins/bulk')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  bulkCreate(@Body() dto: BulkCreateBinsDto, @Request() req: any) { return this.rbService.bulkCreateBins(dto, req.user); }

  @Put('bins/:id/status')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBinStatusDto, @Request() req: any) { return this.rbService.updateBinStatus(id, dto, req.user); }
}
