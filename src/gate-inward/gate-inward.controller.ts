import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GateInwardStatus } from '@prisma/client';
import { GateInwardService } from './gate-inward.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateGateInwardDto, UpdateGateInwardDto,
  VerifyGateInwardDto, RejectGateInwardDto,
} from './dto/gate-inward.dto';

@ApiTags('Gate Inward')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gate-inward')
export class GateInwardController {
  constructor(private readonly service: GateInwardService) {}

  @Post()
  @ApiOperation({ summary: 'Create Gate Inward Entry' })
  create(@Body() dto: CreateGateInwardDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all Gate Inward Entries' })
  @ApiQuery({ name: 'status',  required: false, enum: GateInwardStatus })
  @ApiQuery({ name: 'plantId', required: false })
  @ApiQuery({ name: 'date',    required: false })
  @ApiQuery({ name: 'search',  required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('status')  status?: GateInwardStatus,
    @Query('plantId') plantId?: string,
    @Query('date')    date?: string,
    @Query('search')  search?: string,
  ) {
    return this.service.findAll(user, { status, plantId, date, search });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get Gate Inward statistics' })
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Gate Inward Entry by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Gate Inward Entry (PENDING only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGateInwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify Gate Inward Entry' })
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyGateInwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.verify(id, dto, user);
  }

  @Patch(':id/send-to-stores')
  @ApiOperation({ summary: 'Send to Stores department' })
  sendToStores(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.sendToStores(id, user);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark as Completed' })
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.complete(id, user);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject Gate Inward Entry' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectGateInwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.reject(id, dto, user);
  }
}
