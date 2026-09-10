import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { GrnDiscrepancyService } from './grn-discrepancy.service';
import {
  RaiseDiscrepancyDto, CorrectDiscrepancyDto, PurchaseReviewDto, QcReviewDto,
  RequestResolutionDto, DecideResolutionDto, DirectResolveDto, SegregateDiscrepancyDto,
} from './dto/grn-discrepancy.dto';

@Controller('grn-discrepancies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GrnDiscrepancyController {
  constructor(private service: GrnDiscrepancyService) {}

  @Get()
  @RequirePermissions(Permission.GRN_DISCREPANCY_VIEW)
  findAll(@Request() req: any, @Query() query: any) {
    return this.service.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions(Permission.GRN_DISCREPANCY_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user);
  }

  @Post('grn-item/:grnItemId')
  @RequirePermissions(Permission.GRN_DISCREPANCY_CREATE)
  raise(@Param('grnItemId') grnItemId: string, @Body() dto: RaiseDiscrepancyDto, @Request() req: any) {
    return this.service.raise(grnItemId, dto, req.user);
  }

  @Post(':id/correct')
  @RequirePermissions(Permission.GRN_DISCREPANCY_CORRECT)
  correct(@Param('id') id: string, @Body() dto: CorrectDiscrepancyDto, @Request() req: any) {
    return this.service.correct(id, dto, req.user);
  }

  @Post(':id/purchase-review')
  @RequirePermissions(Permission.GRN_DISCREPANCY_PURCHASE_REVIEW)
  purchaseReview(@Param('id') id: string, @Body() dto: PurchaseReviewDto, @Request() req: any) {
    return this.service.purchaseReview(id, dto, req.user);
  }

  @Post(':id/qc-review')
  @RequirePermissions(Permission.GRN_DISCREPANCY_QC_REVIEW)
  qcReview(@Param('id') id: string, @Body() dto: QcReviewDto, @Request() req: any) {
    return this.service.qcReview(id, dto, req.user);
  }

  @Post(':id/request-resolution')
  @RequirePermissions(Permission.GRN_DISCREPANCY_RESOLVE_REQUEST)
  requestResolution(@Param('id') id: string, @Body() dto: RequestResolutionDto, @Request() req: any) {
    return this.service.requestResolution(id, dto, req.user);
  }

  @Post(':id/decide-resolution')
  @RequirePermissions(Permission.GRN_DISCREPANCY_RESOLVE_APPROVE)
  decideResolution(@Param('id') id: string, @Body() dto: DecideResolutionDto, @Request() req: any) {
    return this.service.decideResolution(id, dto, req.user);
  }

  @Post(':id/resolve-direct')
  @RequirePermissions(Permission.GRN_DISCREPANCY_RESOLVE_REQUEST)
  resolveDirect(@Param('id') id: string, @Body() dto: DirectResolveDto, @Request() req: any) {
    return this.service.resolveDirect(id, dto, req.user);
  }

  @Post(':id/segregate')
  @RequirePermissions(Permission.GRN_DISCREPANCY_SEGREGATE)
  segregate(@Param('id') id: string, @Body() dto: SegregateDiscrepancyDto, @Request() req: any) {
    return this.service.segregate(id, dto, req.user);
  }
}
