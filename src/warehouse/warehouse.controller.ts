import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateWarehouseDto, UpdateWarehouseDto,
  CreateZoneDto, CreateRackDto, CreateBinDto,
} from './dto/warehouse.dto';

@ApiTags('Warehouse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly service: WarehouseService) {}

  // ── WAREHOUSE ─────────────────────────────────────────────────
  @Post()
  create(@Body() dto: CreateWarehouseDto, @CurrentUser() user: any) {
    return this.service.createWarehouse(dto, user);
  }

  @Get()
  @ApiQuery({ name: 'plantId', required: false })
  findAll(@CurrentUser() user: any, @Query('plantId') plantId?: string) {
    return this.service.findAllWarehouses(user, plantId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneWarehouse(id);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWarehouseDto, @CurrentUser() user: any) {
    return this.service.updateWarehouse(id, dto, user);
  }

  // ── ZONE ─────────────────────────────────────────────────────
  @Post('zones')
  createZone(@Body() dto: CreateZoneDto, @CurrentUser() user: any) {
    return this.service.createZone(dto, user);
  }

  @Get(':warehouseId/zones')
  findZones(@Param('warehouseId', ParseUUIDPipe) warehouseId: string) {
    return this.service.findZonesByWarehouse(warehouseId);
  }

  // ── RACK ─────────────────────────────────────────────────────
  @Post('racks')
  createRack(@Body() dto: CreateRackDto, @CurrentUser() user: any) {
    return this.service.createRack(dto, user);
  }

  @Get('zones/:zoneId/racks')
  findRacks(@Param('zoneId', ParseUUIDPipe) zoneId: string) {
    return this.service.findRacksByZone(zoneId);
  }

  // ── BIN ──────────────────────────────────────────────────────
  @Post('bins')
  createBin(@Body() dto: CreateBinDto, @CurrentUser() user: any) {
    return this.service.createBin(dto, user);
  }

  @Get('racks/:rackId/bins')
  findBins(@Param('rackId', ParseUUIDPipe) rackId: string) {
    return this.service.findBinsByRack(rackId);
  }
}
