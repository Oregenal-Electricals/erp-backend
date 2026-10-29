import { Module } from '@nestjs/common';
import { InventoryDashboardController } from './inventory-dashboard.controller';
import { InventoryDashboardService } from './inventory-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { MaterialHoldDaysModule } from '../material-hold-days/material-hold-days.module';

@Module({
  imports: [PrismaModule, CommonModule, MaterialHoldDaysModule],
  controllers: [InventoryDashboardController],
  providers: [InventoryDashboardService],
  exports: [InventoryDashboardService],
})
export class InventoryDashboardModule {}
