import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GatePassStatus, GatePassType } from '@prisma/client';
import { GatePassService } from './gate-pass.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateGatePassDto, ApproveGatePassDto,
  CancelGatePassDto, ReturnGatePassDto,
} from './dto/gate-pass.dto';

@ApiTags('Gate Pass')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('gate-passes')
export class GatePassController {
  constructor(private readonly service: GatePassService) {}

  @Post()
  @RequirePermissions(Permission.SYSTEM_CREATE)
  @ApiOperation({ summary: 'Create Gate Pass request' })
  create(@Body() dto: CreateGatePassDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Get()
  @RequirePermissions(Permission.GATE_PASS_VIEW)
  @ApiOperation({ summary: 'List all Gate Passes' })
  @ApiQuery({ name: 'status',  required: false, enum: GatePassStatus })
  @ApiQuery({ name: 'type',    required: false, enum: GatePassType })
  @ApiQuery({ name: 'plantId', required: false })
  @ApiQuery({ name: 'search',  required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('status')  status?: GatePassStatus,
    @Query('type')    type?: string,
    @Query('plantId') plantId?: string,
    @Query('search')  search?: string,
  ) {
    return this.service.findAll(user, { status, type, plantId, search });
  }

  @Get('stats')
  @RequirePermissions(Permission.GATE_PASS_VIEW)
  @ApiOperation({ summary: 'Get Gate Pass statistics' })
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  @RequirePermissions(Permission.GATE_PASS_VIEW)
  @ApiOperation({ summary: 'Get Gate Pass by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/approve')
  @RequirePermissions(Permission.SYSTEM_EDIT)
  @ApiOperation({ summary: 'Approve Gate Pass' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveGatePassDto,
    @CurrentUser() user: any,
  ) {
    return this.service.approve(id, dto, user);
  }

  @Patch(':id/issue')
  @RequirePermissions(Permission.SYSTEM_EDIT)
  @ApiOperation({ summary: 'Issue Gate Pass (security)' })
  issue(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.issue(id, user);
  }

  @Patch(':id/return')
  @RequirePermissions(Permission.SYSTEM_EDIT)
  @ApiOperation({ summary: 'Mark items returned (RETURNABLE only)' })
  markReturned(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnGatePassDto,
    @CurrentUser() user: any,
  ) {
    return this.service.markReturned(id, dto, user);
  }

  @Patch(':id/close')
  @RequirePermissions(Permission.SYSTEM_EDIT)
  @ApiOperation({ summary: 'Close Gate Pass' })
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.close(id, user);
  }

  @Patch(':id/cancel')
  @RequirePermissions(Permission.SYSTEM_EDIT)
  @ApiOperation({ summary: 'Cancel Gate Pass' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelGatePassDto,
    @CurrentUser() user: any,
  ) {
    return this.service.cancel(id, dto, user);
  }
}
