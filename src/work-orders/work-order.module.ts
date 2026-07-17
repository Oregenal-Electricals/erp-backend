import { Module } from '@nestjs/common';
import { WorkOrderController } from './work-order.controller';
import { WorkOrderService } from './work-order.service';
import { MaterialReservationService } from './material-reservation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [WorkOrderController],
  providers: [WorkOrderService, MaterialReservationService],
  exports: [WorkOrderService, MaterialReservationService],
})
export class WorkOrderModule {}
