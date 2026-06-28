import { Module } from '@nestjs/common';
import { InventoryReportsController } from './inventory-reports.controller';
import { InventoryReportsService } from './inventory-reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [InventoryReportsController],
  providers: [InventoryReportsService],
  exports: [InventoryReportsService],
})
export class InventoryReportsModule {}
