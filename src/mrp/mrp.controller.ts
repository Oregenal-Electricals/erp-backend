import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MrpService } from './mrp.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('mrp')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MrpController {
  constructor(private readonly mrpService: MrpService) {}

  @Get('calculate/:woId')
  @RequirePermissions(Permission.MRP_VIEW)
  calculate(@Param('woId') woId: string, @Request() req: any) { return this.mrpService.calculateMrp(woId, req.user); }

  @Get('shortage-report')
  @RequirePermissions(Permission.MRP_VIEW)
  shortageReport(@Request() req: any) { return this.mrpService.getShortageReport(req.user); }

  @Get('material-plan')
  @RequirePermissions(Permission.MRP_VIEW)
  materialPlan(@Request() req: any, @Query() query: any) { return this.mrpService.getMaterialPlan(req.user, query); }
}
