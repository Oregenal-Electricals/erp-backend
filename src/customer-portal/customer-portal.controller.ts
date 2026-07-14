import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { CustomerPortalService } from './customer-portal.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('customer-portal')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomerPortalController {
  constructor(private readonly cpService: CustomerPortalService) {}

  @Get('dashboard/:customerId')
  @RequirePermissions(Permission.CUSTOMER_PORTAL_VIEW)
  getDashboard(@Param('customerId') customerId: string, @Request() req: any) {
    return this.cpService.getCustomerDashboard(customerId, req.user.companyId);
  }

  @Get('orders/:customerId')
  @RequirePermissions(Permission.CUSTOMER_PORTAL_VIEW)
  getOrders(@Param('customerId') customerId: string, @Query() query: any, @Request() req: any) {
    return this.cpService.getCustomerOrders(customerId, req.user.companyId, query);
  }

  @Get('dispatches/:customerId')
  @RequirePermissions(Permission.CUSTOMER_PORTAL_VIEW)
  getDispatches(@Param('customerId') customerId: string, @Request() req: any) {
    return this.cpService.getCustomerDispatches(customerId, req.user.companyId);
  }

  @Get('complaints/:customerId')
  @RequirePermissions(Permission.CUSTOMER_PORTAL_VIEW)
  getComplaints(@Param('customerId') customerId: string, @Request() req: any) {
    return this.cpService.getCustomerComplaints(customerId, req.user.companyId);
  }
}
