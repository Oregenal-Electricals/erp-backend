import { Module } from '@nestjs/common';
import { DispatchGateOutController } from './dispatch-gate-out.controller';
import { DispatchGateOutService } from './dispatch-gate-out.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { DispatchDocumentReadinessModule } from '../dispatch-document-readiness/dispatch-document-readiness.module';
import { StockLedgerModule } from '../stock-ledger/stock-ledger.module';

@Module({
  imports: [PrismaModule, CommonModule, DispatchDocumentReadinessModule, StockLedgerModule],
  controllers: [DispatchGateOutController],
  providers: [DispatchGateOutService],
  exports: [DispatchGateOutService],
})
export class DispatchGateOutModule {}
