import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { VendorPortalService } from './vendor-portal.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('vendor-portal')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorPortalController {
  constructor(private readonly vpService: VendorPortalService) {}

  @Get('dashboard/:vendorId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getDashboard(@Param('vendorId') vendorId: string, @Request() req: any) {
    return this.vpService.getVendorDashboard(vendorId, req.user.companyId);
  }

  @Get('purchase-orders/:vendorId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getPOs(@Param('vendorId') vendorId: string, @Query() query: any, @Request() req: any) {
    return this.vpService.getVendorPOs(vendorId, req.user.companyId, query);
  }

  @Get('rfqs/:vendorId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getRFQs(@Param('vendorId') vendorId: string, @Request() req: any) {
    return this.vpService.getVendorRFQs(vendorId, req.user.companyId);
  }

  @Get('quotations/:vendorId')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getQuotations(@Param('vendorId') vendorId: string, @Request() req: any) {
    return this.vpService.getVendorQuotations(vendorId, req.user.companyId);
  }
}
