import { Module, forwardRef } from '@nestjs/common';
import { WorkOrderController } from './work-order.controller';
import { WorkOrderService } from './work-order.service';
import { MaterialReservationService } from './material-reservation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { MrpModule } from '../mrp/mrp.module';
@Module({
  imports: [PrismaModule, CommonModule, WorkflowsModule, NotificationsModule, SettingsModule, forwardRef(() => MrpModule)],
  controllers: [WorkOrderController],
  providers: [WorkOrderService, MaterialReservationService],
  exports: [WorkOrderService, MaterialReservationService],
})
export class WorkOrderModule {}
