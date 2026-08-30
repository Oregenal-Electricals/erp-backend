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
  FlagMismatchDto, ResolveMismatchCorrectReferenceDto, ResolveMismatchApprovedExceptionDto, ResolveMismatchRejectedDto,
  FlagDamageDto, ResolveDamageRejectDto, ResolveDamageAcceptExceptionDto, RecordReturnGateOutDto,
  VerifyPackageCountDto, ResolvePackageCountRecountDto, ResolvePackageCountEscalateDto,
  ResolvePackageCountApprovedInwardDto, ResolvePackageCountRejectedDto,
  FlagDocumentMissingDto, ResolveDocumentMissingExceptionDto, ResolveDocumentMissingRejectDto,
  FlagMultiplePosDto, ResolveMultiplePosSplitDto, ResolveMultiplePosRejectedDto,
  FlagNoPoReferenceDto, ResolveNoPoReferenceApprovedDto, ResolveNoPoReferenceRejectedDto,
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

  // GATE-006/007: Gate/Security flags a vendor or material mismatch
  // themselves - same permission as verify(), since this is Gate's
  // own action, not an approver decision.
  @Patch(':id/flag-mismatch')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'GATE-006/007: Gate flags a vendor or material mismatch, stopping normal Gate-In' })
  flagMismatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FlagMismatchDto,
    @CurrentUser() user: any,
  ) {
    return this.service.flagMismatch(id, dto.mismatchType, dto.expectedValue, dto.actualValue, dto.remarks, user);
  }

  // GATE-006/007 resolution - Purchase/Admin/SuperAdmin only.
  @Patch(':id/resolve-mismatch/correct-reference')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-006/007: correct the declared vendor/material and return to normal flow' })
  resolveMismatchCorrectReference(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveMismatchCorrectReferenceDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveMismatchCorrectReference(id, dto.correctedValue, dto.reason, user);
  }

  @Patch(':id/resolve-mismatch/approved-exception')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-006/007: approve an exception to receive despite the mismatch' })
  resolveMismatchApprovedException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveMismatchApprovedExceptionDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveMismatchApprovedException(id, dto.reason, user);
  }

  @Patch(':id/resolve-mismatch/reject')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-006/007: reject the material at the gate' })
  resolveMismatchRejected(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveMismatchRejectedDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveMismatchRejected(id, dto.reason, user);
  }

  // GATE-008/009: visible damage flagged by Gate itself.
  @Patch(':id/flag-damage')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'GATE-008/009: Gate flags visible material/packaging damage, stopping normal Gate-In' })
  flagDamage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FlagDamageDto,
    @CurrentUser() user: any,
  ) {
    return this.service.flagDamage(id, dto.damageType, dto.description, dto.affectedPackages, dto.gateRecommendation, user);
  }

  @Patch(':id/resolve-damage/reject')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-008/009: reject the damaged material at the gate' })
  resolveDamageReject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDamageRejectDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveDamageReject(id, dto.reason, user);
  }

  @Patch(':id/resolve-damage/accept-exception')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-008/009: accept under exception for detailed Store/QC inspection' })
  resolveDamageAcceptException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDamageAcceptExceptionDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveDamageAcceptException(id, dto.reason, user);
  }

  @Patch(':id/record-return-gate-out')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'GATE-008/009: record that rejected damaged material has physically left the gate' })
  recordReturnGateOut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordReturnGateOutDto,
    @CurrentUser() user: any,
  ) {
    return this.service.recordReturnGateOut(id, dto.remarks, user);
  }

  // GATE-010: Package/Carton Count Mismatch.
  @Patch(':id/verify-package-count')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'GATE-010: Gate compares physical package count against the declared figure' })
  verifyPackageCount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyPackageCountDto,
    @CurrentUser() user: any,
  ) {
    return this.service.verifyPackageCount(id, dto.actualPackageCount, user);
  }

  @Patch(':id/resolve-package-count/recount')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'GATE-010: Gate recounts - resolves automatically if it now matches' })
  resolvePackageCountRecount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolvePackageCountRecountDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolvePackageCountRecount(id, dto.newActualCount, dto.remarks, user);
  }

  @Patch(':id/resolve-package-count/escalate')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-010: escalate to Purchase/Store verification - hold stays open' })
  resolvePackageCountEscalate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolvePackageCountEscalateDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolvePackageCountEscalate(id, dto.remarks, user);
  }

  @Patch(':id/resolve-package-count/approved-inward')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-010: approve inward despite the count mismatch' })
  resolvePackageCountApprovedInward(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolvePackageCountApprovedInwardDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolvePackageCountApprovedInward(id, dto.reason, user);
  }

  @Patch(':id/resolve-package-count/reject')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-010: reject the material over the count mismatch' })
  resolvePackageCountRejected(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolvePackageCountRejectedDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolvePackageCountRejected(id, dto.reason, user);
  }

  // GATE-012: Challan / Invoice Document Missing.
  @Patch(':id/flag-document-missing')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'GATE-012: Gate flags that the vehicle arrived without a physical challan/invoice document' })
  flagDocumentMissing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FlagDocumentMissingDto,
    @CurrentUser() user: any,
  ) {
    return this.service.flagDocumentMissing(id, dto.documentType, dto.reason, user);
  }

  @Patch(':id/resolve-document-missing/exception')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-012: accept the material on undertaking the document will follow' })
  resolveDocumentMissingException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDocumentMissingExceptionDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveDocumentMissingException(id, dto.reason, user);
  }

  @Patch(':id/resolve-document-missing/reject')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-012: reject the material over the missing document' })
  resolveDocumentMissingReject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDocumentMissingRejectDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveDocumentMissingReject(id, dto.reason, user);
  }

  // GATE-016: Multiple POs in One Vehicle.
  @Patch(':id/flag-multiple-pos')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'GATE-016: Gate flags that the challan references more than one PO' })
  flagMultiplePOs(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FlagMultiplePosDto,
    @CurrentUser() user: any,
  ) {
    return this.service.flagMultiplePOs(id, dto.poNumbersFound, dto.reason, user);
  }

  @Patch(':id/resolve-multiple-pos/split')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-016: confirm which PO this entry belongs to, record the others for follow-up' })
  resolveMultiplePosSplit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveMultiplePosSplitDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveMultiplePosSplit(id, dto.confirmedPoId, dto.otherPoNumbers, dto.reason, user);
  }

  @Patch(':id/resolve-multiple-pos/reject')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-016: reject the material over unreconcilable multiple POs' })
  resolveMultiplePosRejected(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveMultiplePosRejectedDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveMultiplePosRejected(id, dto.reason, user);
  }

  // GATE-015: Material Arrives Without PO - voluntary Gate escalation only.
  @Patch(':id/flag-no-po-reference')
  @RequirePermissions(Permission.GATE_INWARD_VERIFY)
  @ApiOperation({ summary: 'GATE-015: Gate flags a no-PO delivery for Purchase review' })
  flagNoPoReference(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FlagNoPoReferenceDto,
    @CurrentUser() user: any,
  ) {
    return this.service.flagNoPoReference(id, dto.reason, user);
  }

  @Patch(':id/resolve-no-po-reference/approved')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-015: confirm this is a legitimate non-PO delivery' })
  resolveNoPoReferenceApproved(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveNoPoReferenceApprovedDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveNoPoReferenceApproved(id, dto.reason, user);
  }

  @Patch(':id/resolve-no-po-reference/reject')
  @RequirePermissions(Permission.GATE_INWARD_RESOLVE_HOLD)
  @ApiOperation({ summary: 'GATE-015: reject the material for lacking a required PO' })
  resolveNoPoReferenceRejected(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveNoPoReferenceRejectedDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveNoPoReferenceRejected(id, dto.reason, user);
  }
}
