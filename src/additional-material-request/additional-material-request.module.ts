import { Module } from '@nestjs/common';
import { AdditionalMaterialRequestController } from './additional-material-request.controller';
import { AdditionalMaterialRequestService } from './additional-material-request.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { WorkOrderModule } from '../work-orders/work-order.module';

@Module({
  imports: [PrismaModule, CommonModule, WorkflowsModule, WorkOrderModule],
  controllers: [AdditionalMaterialRequestController],
  providers: [AdditionalMaterialRequestService],
  exports: [AdditionalMaterialRequestService],
})
export class AdditionalMaterialRequestModule {}
