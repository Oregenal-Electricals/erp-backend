import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateWarehouseDto, UpdateWarehouseDto,
  CreateZoneDto, CreateRackDto, CreateBinDto,
} from './dto/warehouse.dto';

@ApiTags('Warehouse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly service: WarehouseService) {}

  // ── WAREHOUSE ─────────────────────────────────────────────────
  @Post()
  @RequirePermissions(Permission.INVENTORY_CREATE)
  create(@Body() dto: CreateWarehouseDto, @CurrentUser() user: any) {
    return this.service.createWarehouse(dto, user);
  }

  @Get()
  @RequirePermissions(Permission.WAREHOUSE_VIEW)
  @ApiQuery({ name: 'plantId', required: false })
  findAll(@CurrentUser() user: any, @Query('plantId') plantId?: string) {
    return this.service.findAllWarehouses(user, plantId);
  }

  @Get('stats')
  @RequirePermissions(Permission.WAREHOUSE_VIEW)
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  @RequirePermissions(Permission.WAREHOUSE_VIEW)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneWarehouse(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWarehouseDto, @CurrentUser() user: any) {
    return this.service.updateWarehouse(id, dto, user);
  }

  // ── ZONE ─────────────────────────────────────────────────────
  @Post('zones')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createZone(@Body() dto: CreateZoneDto, @CurrentUser() user: any) {
    return this.service.createZone(dto, user);
  }

  @Get(':warehouseId/zones')
  @RequirePermissions(Permission.WAREHOUSE_VIEW)
  findZones(@Param('warehouseId', ParseUUIDPipe) warehouseId: string) {
    return this.service.findZonesByWarehouse(warehouseId);
  }

  // ── RACK ─────────────────────────────────────────────────────
  @Post('racks')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createRack(@Body() dto: CreateRackDto, @CurrentUser() user: any) {
    return this.service.createRack(dto, user);
  }

  @Get('zones/:zoneId/racks')
  @RequirePermissions(Permission.WAREHOUSE_VIEW)
  findRacks(@Param('zoneId', ParseUUIDPipe) zoneId: string) {
    return this.service.findRacksByZone(zoneId);
  }

  // ── BIN ──────────────────────────────────────────────────────
  @Post('bins')
  @RequirePermissions(Permission.INVENTORY_CREATE)
  createBin(@Body() dto: CreateBinDto, @CurrentUser() user: any) {
    return this.service.createBin(dto, user);
  }

  @Get('racks/:rackId/bins')
  @RequirePermissions(Permission.WAREHOUSE_VIEW)
  findBins(@Param('rackId', ParseUUIDPipe) rackId: string) {
    return this.service.findBinsByRack(rackId);
  }
}
