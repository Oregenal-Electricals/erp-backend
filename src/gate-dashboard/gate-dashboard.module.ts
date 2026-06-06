import { Module } from '@nestjs/common';
import { GateDashboardController } from './gate-dashboard.controller';
import { GateDashboardService } from './gate-dashboard.service';

@Module({
  controllers: [GateDashboardController],
  providers: [GateDashboardService],
})
export class GateDashboardModule {}
