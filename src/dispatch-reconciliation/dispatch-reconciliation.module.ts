import { Module } from '@nestjs/common';
import { DispatchReconciliationController } from './dispatch-reconciliation.controller';
import { DispatchReconciliationService } from './dispatch-reconciliation.service';
import { DispatchTraceService } from './dispatch-trace.service';
import { DispatchDashboardService } from './dispatch-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DispatchReconciliationController],
  providers: [DispatchReconciliationService, DispatchTraceService, DispatchDashboardService],
  exports: [DispatchReconciliationService, DispatchTraceService, DispatchDashboardService],
})
export class DispatchReconciliationModule {}
