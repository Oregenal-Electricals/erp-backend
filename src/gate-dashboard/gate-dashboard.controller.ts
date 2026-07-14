import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GateDashboardService } from './gate-dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Gate Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('gate-dashboard')
export class GateDashboardController {
  constructor(private readonly service: GateDashboardService) {}

  @Get('summary')
  @RequirePermissions(Permission.GATE_DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Get full gate security dashboard summary' })
  getSummary(@CurrentUser() user: any) {
    return this.service.getSummary(user);
  }
}
