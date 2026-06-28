import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { InventoryValuationService } from './inventory-valuation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('inventory-valuation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryValuationController {
  constructor(private readonly ivService: InventoryValuationService) {}

  @Get('summary')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getSummary(@Request() req: any, @Query() query: any) { return this.ivService.getSummary(req.user, query); }

  @Get('aging')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getAging(@Request() req: any, @Query() query: any) { return this.ivService.getAging(req.user, query); }

  @Get('slow-moving')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getSlowMoving(@Request() req: any, @Query() query: any) { return this.ivService.getSlowMoving(req.user, query); }

  @Get('fifo-value')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getFifoValue(@Request() req: any, @Query() query: any) { return this.ivService.getFifoValue(req.user, query); }
}
