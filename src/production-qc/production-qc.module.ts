import { Module } from '@nestjs/common';
import { ProductionQcController } from './production-qc.controller';
import { ProductionQcService } from './production-qc.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { WorkOrderModule } from '../work-orders/work-order.module';

@Module({
  imports: [PrismaModule, CommonModule, WorkOrderModule],
  controllers: [ProductionQcController],
  providers: [ProductionQcService],
  exports: [ProductionQcService],
})
export class ProductionQcModule {}
