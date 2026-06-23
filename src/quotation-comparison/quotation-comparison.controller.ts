import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { QuotationComparisonService } from './quotation-comparison.service';
import { SelectVendorsDto } from './dto/comparison.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('quotation-comparison')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QuotationComparisonController {
  constructor(private readonly compService: QuotationComparisonService) {}

  @Get('stats')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getStats(@Request() req: any) { return this.compService.getStats(req.user); }

  @Get(':rfqId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getMatrix(@Param('rfqId') rfqId: string, @Request() req: any) { return this.compService.getMatrix(rfqId, req.user); }

  @Get(':rfqId/summary')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getSummary(@Param('rfqId') rfqId: string, @Request() req: any) { return this.compService.getSummary(rfqId, req.user); }

  @Post(':rfqId/select')
  @RequirePermissions(Permission.INVENTORY_EDIT)
  selectVendors(@Param('rfqId') rfqId: string, @Body() dto: SelectVendorsDto, @Request() req: any) { return this.compService.selectVendors(rfqId, dto, req.user); }
}
