import { Module } from '@nestjs/common';
import { QualityDashboardController } from './quality-dashboard.controller';
import { QualityDashboardService } from './quality-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [QualityDashboardController],
  providers: [QualityDashboardService],
})
export class QualityDashboardModule {}
