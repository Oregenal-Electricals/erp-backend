import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GateOutwardStatus } from '@prisma/client';
import { GateOutwardService } from './gate-outward.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateGateOutwardDto, UpdateGateOutwardDto,
  ApproveGateOutwardDto, CancelGateOutwardDto,
} from './dto/gate-outward.dto';

@ApiTags('Gate Outward')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('gate-outward')
export class GateOutwardController {
  constructor(private readonly service: GateOutwardService) {}

  @Post()
  @RequirePermissions(Permission.GATE_OUTWARD_CREATE)
  @ApiOperation({ summary: 'Create Gate Outward Entry' })
  create(@Body() dto: CreateGateOutwardDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Get()
  @RequirePermissions(Permission.GATE_OUTWARD_VIEW)
  @ApiOperation({ summary: 'List all Gate Outward Entries' })
  @ApiQuery({ name: 'status',  required: false, enum: GateOutwardStatus })
  @ApiQuery({ name: 'plantId', required: false })
  @ApiQuery({ name: 'date',    required: false })
  @ApiQuery({ name: 'search',  required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('status')  status?: GateOutwardStatus,
    @Query('plantId') plantId?: string,
    @Query('date')    date?: string,
    @Query('search')  search?: string,
  ) {
    return this.service.findAll(user, { status, plantId, date, search });
  }

  @Get('stats')
  @RequirePermissions(Permission.GATE_OUTWARD_VIEW)
  @ApiOperation({ summary: 'Get Gate Outward statistics' })
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  @RequirePermissions(Permission.GATE_OUTWARD_VIEW)
  @ApiOperation({ summary: 'Get Gate Outward Entry by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.GATE_OUTWARD_CREATE)
  @ApiOperation({ summary: 'Update Gate Outward Entry (PENDING only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGateOutwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/approve')
  @RequirePermissions(Permission.GATE_OUTWARD_AUTHORIZE)
  @ApiOperation({ summary: 'Approve for dispatch' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveGateOutwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.approve(id, dto, user);
  }

  @Patch(':id/dispatch')
  @RequirePermissions(Permission.GATE_OUTWARD_AUTHORIZE)
  @ApiOperation({ summary: 'Mark as Dispatched' })
  dispatch(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.dispatch(id, user);
  }

  @Patch(':id/delivered')
  @RequirePermissions(Permission.GATE_OUTWARD_AUTHORIZE)
  @ApiOperation({ summary: 'Mark as Delivered' })
  markDelivered(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.markDelivered(id, user);
  }

  @Patch(':id/cancel')
  @RequirePermissions(Permission.GATE_OUTWARD_AUTHORIZE)
  @ApiOperation({ summary: 'Cancel Gate Outward Entry' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelGateOutwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.cancel(id, dto, user);
  }
}
