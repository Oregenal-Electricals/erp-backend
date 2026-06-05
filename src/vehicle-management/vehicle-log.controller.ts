import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehicleLogStatus, VehiclePurpose } from '@prisma/client';
import { VehicleManagementService } from './vehicle-management.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LogVehicleEntryDto, LogVehicleExitDto } from './dto/vehicle.dto';

@ApiTags('Vehicle Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicle-logs')
export class VehicleLogController {
  constructor(private readonly service: VehicleManagementService) {}

  @Post('entry')
  @ApiOperation({ summary: 'Log vehicle entry' })
  logEntry(@Body() dto: LogVehicleEntryDto, @CurrentUser() user: any) {
    return this.service.logEntry(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all vehicle logs' })
  @ApiQuery({ name: 'plantId', required: false })
  @ApiQuery({ name: 'status',  required: false, enum: VehicleLogStatus })
  @ApiQuery({ name: 'purpose', required: false, enum: VehiclePurpose })
  @ApiQuery({ name: 'date',    required: false })
  findAllLogs(
    @CurrentUser() user: any,
    @Query('plantId') plantId?: string,
    @Query('status')  status?: VehicleLogStatus,
    @Query('purpose') purpose?: string,
    @Query('date')    date?: string,
  ) {
    return this.service.findAllLogs(user, { plantId, status, purpose, date });
  }

  @Get('active')
  @ApiOperation({ summary: 'Get vehicles currently inside' })
  getActiveVehicles(@CurrentUser() user: any) {
    return this.service.getActiveVehicles(user);
  }

  @Patch(':id/exit')
  @ApiOperation({ summary: 'Log vehicle exit with out weight' })
  logExit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LogVehicleExitDto,
    @CurrentUser() user: any,
  ) {
    return this.service.logExit(id, dto, user);
  }
}
