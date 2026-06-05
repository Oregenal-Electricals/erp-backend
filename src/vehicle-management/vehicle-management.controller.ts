import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehicleLogStatus, VehiclePurpose } from '@prisma/client';
import { VehicleManagementService } from './vehicle-management.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateVehicleDto, UpdateVehicleDto,
  LogVehicleEntryDto, LogVehicleExitDto,
} from './dto/vehicle.dto';

@ApiTags('Vehicle Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehicleManagementController {
  constructor(private readonly service: VehicleManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new vehicle' })
  createVehicle(@Body() dto: CreateVehicleDto, @CurrentUser() user: any) {
    return this.service.createVehicle(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all vehicles' })
  @ApiQuery({ name: 'search', required: false })
  findAllVehicles(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.service.findAllVehicles(user, search);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get vehicle statistics' })
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID with history' })
  findOneVehicle(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneVehicle(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vehicle details' })
  updateVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateVehicle(id, dto, user);
  }
}
