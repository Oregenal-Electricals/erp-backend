import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GateOutwardStatus } from '@prisma/client';
import { GateOutwardService } from './gate-outward.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateGateOutwardDto, UpdateGateOutwardDto,
  ApproveGateOutwardDto, CancelGateOutwardDto,
} from './dto/gate-outward.dto';

@ApiTags('Gate Outward')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gate-outward')
export class GateOutwardController {
  constructor(private readonly service: GateOutwardService) {}

  @Post()
  @ApiOperation({ summary: 'Create Gate Outward Entry' })
  create(@Body() dto: CreateGateOutwardDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Get()
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
  @ApiOperation({ summary: 'Get Gate Outward statistics' })
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Gate Outward Entry by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Gate Outward Entry (PENDING only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGateOutwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve for dispatch' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveGateOutwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.approve(id, dto, user);
  }

  @Patch(':id/dispatch')
  @ApiOperation({ summary: 'Mark as Dispatched' })
  dispatch(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.dispatch(id, user);
  }

  @Patch(':id/delivered')
  @ApiOperation({ summary: 'Mark as Delivered' })
  markDelivered(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.markDelivered(id, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel Gate Outward Entry' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelGateOutwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.cancel(id, dto, user);
  }
}
