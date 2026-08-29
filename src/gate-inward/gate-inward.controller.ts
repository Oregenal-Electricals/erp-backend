import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GateInwardStatus } from '@prisma/client';
import { GateInwardService } from './gate-inward.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateGateInwardDto, UpdateGateInwardDto,
  VerifyGateInwardDto, RejectGateInwardDto, GateInDto,
  ResolveHoldWithPoDto, ResolveHoldAsNonPoDto, ResolveHoldAsRejectedDto,
  ReturnMaterialDto, ApprovedExceptionDto, CorrectPoReferenceDto,
} from './dto/gate-inward.dto';

@ApiTags('Gate Inward')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('gate-inward')
export class GateInwardController {
  constructor(private readonly service: GateInwardService) {}

  @Post()
  @RequirePermissions(Permission.GATE_INWARD_CREATE)
  @ApiOperation({ summary: 'Create Gate Inward Entry' })
  create(@Body() dto: CreateGateInwardDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Get()
  @RequirePermissions(Permission.GATE_INWARD_VIEW)
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
  @RequirePermissions(Permission.GATE_INWARD_VIEW)
  @ApiOperation({ summary: 'Get Gate Inward statistics' })
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  @RequirePermissions(Permission.GATE_INWARD_VIEW)
  @ApiOperation({ summary: 'Get Gate Inward Entry by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.GATE_INWARD_CREATE)
  @ApiOperation({ summary: 'Update Gate Inward Entry (PENDING only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGateInwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/verify')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'Verify Gate Inward Entry' })
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyGateInwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.verify(id, dto, user);
  }

  @Patch(':id/gate-in')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'Let the vehicle in at the gate after verification' })
  gateIn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GateInDto,
    @CurrentUser() user: any,
  ) {
    return this.service.gateIn(id, dto, user);
  }

  @Patch(':id/send-to-stores')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'Send to Stores department' })
  sendToStores(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.sendToStores(id, user);
  }

  @Patch(':id/complete')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'Mark as Completed' })
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.complete(id, user);
  }

  @Patch(':id/reject')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'Reject Gate Inward Entry' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectGateInwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.reject(id, dto, user);
  }

  // GATE-003: PO Not Found hold resolution - Purchase only, never
  // Gate/Security.
  @Patch(':id/resolve-hold/identify-po')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-003: Purchase identifies the correct PO for a held entry' })
  resolveHoldWithPo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveHoldWithPoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveHoldWithPo(id, dto.poId, dto.remarks, user);
  }

  @Patch(':id/resolve-hold/authorize-non-po')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-003: Purchase authorizes a non-PO receipt exception for a held entry' })
  resolveHoldAsNonPo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveHoldAsNonPoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveHoldAsNonPo(id, dto.remarks, user);
  }

  @Patch(':id/resolve-hold/reject')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-003: Purchase rejects the material for a held entry' })
  resolveHoldAsRejected(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveHoldAsRejectedDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveHoldAsRejected(id, dto.rejectionReason, user);
  }

  // GATE-004/005: PO Cancelled/Closed hold resolution - Purchase
  // only. Same permission as GATE-003's resolve-hold routes, since
  // it's the same actors making the same kind of call.
  @Patch(':id/resolve-status-hold/return-material')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-004/005: Purchase returns the material for a Cancelled/Closed PO hold' })
  resolveReturnMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnMaterialDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveReturnMaterial(id, dto.reason, user);
  }

  @Patch(':id/resolve-status-hold/approved-exception')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-004/005: Purchase approves an exception to receive despite Cancelled/Closed PO' })
  resolveApprovedException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovedExceptionDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveApprovedException(id, dto.reason, user);
  }

  @Patch(':id/resolve-status-hold/correct-po')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-004/005: Purchase corrects the PO reference for a Cancelled/Closed PO hold' })
  resolveCorrectPoReference(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CorrectPoReferenceDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveCorrectPoReference(id, dto.poId, dto.reason, user);
  }
}
