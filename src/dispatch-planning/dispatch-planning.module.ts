import { Module } from '@nestjs/common';
import { DispatchPlanningController } from './dispatch-planning.controller';
import { DispatchPlanningService } from './dispatch-planning.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DispatchPlanningController],
  providers: [DispatchPlanningService],
  exports: [DispatchPlanningService],
})
export class DispatchPlanningModule {}
