import { Module } from '@nestjs/common';
import { DispatchPlanningController } from './dispatch-planning.controller';
import { DispatchPlanningService } from './dispatch-planning.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';

@Module({
  imports: [PrismaModule, CommonModule, SalesOrdersModule],
  controllers: [DispatchPlanningController],
  providers: [DispatchPlanningService],
  exports: [DispatchPlanningService],
})
export class DispatchPlanningModule {}
