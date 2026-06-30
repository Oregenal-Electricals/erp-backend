import { Module } from '@nestjs/common';
import { ProductionDashboardController } from './production-dashboard.controller';
import { ProductionDashboardService } from './production-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ProductionDashboardController],
  providers: [ProductionDashboardService],
})
export class ProductionDashboardModule {}
