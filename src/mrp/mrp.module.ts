import { Module, forwardRef } from '@nestjs/common';
import { MrpController } from './mrp.controller';
import { MrpService } from './mrp.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { WorkOrderModule } from '../work-orders/work-order.module';
import { RoutingModule } from '../routing/routing.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
@Module({
  imports: [PrismaModule, CommonModule, forwardRef(() => WorkOrderModule), RoutingModule, SalesOrdersModule],
  controllers: [MrpController],
  providers: [MrpService],
  exports: [MrpService],
})
export class MrpModule {}
