import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GateDashboardService } from './gate-dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Gate Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gate-dashboard')
export class GateDashboardController {
  constructor(private readonly service: GateDashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get full gate security dashboard summary' })
  getSummary(@CurrentUser() user: any) {
    return this.service.getSummary(user);
  }
}
