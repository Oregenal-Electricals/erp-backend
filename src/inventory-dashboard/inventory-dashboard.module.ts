import { Module } from '@nestjs/common';
import { InventoryDashboardController } from './inventory-dashboard.controller';
import { InventoryDashboardService } from './inventory-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [InventoryDashboardController],
  providers: [InventoryDashboardService],
  exports: [InventoryDashboardService],
})
export class InventoryDashboardModule {}
