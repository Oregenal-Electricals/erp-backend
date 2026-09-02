import { Module } from '@nestjs/common';
import { ProductionEntryController } from './production-entry.controller';
import { ProductionEntryService } from './production-entry.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { WorkOrderModule } from '../work-orders/work-order.module';
import { SettingsModule } from '../settings/settings.module';
@Module({
  imports: [PrismaModule, CommonModule, WorkOrderModule, SettingsModule],
  controllers: [ProductionEntryController],
  providers: [ProductionEntryService],
  exports: [ProductionEntryService],
})
export class ProductionEntryModule {}
