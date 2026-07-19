import { Module } from '@nestjs/common';
import { FgReceiptController } from './fg-receipt.controller';
import { FgReceiptService } from './fg-receipt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { StockLedgerModule } from '../stock-ledger/stock-ledger.module';
import { WorkOrderModule } from '../work-orders/work-order.module';
@Module({
  imports: [PrismaModule, CommonModule, StockLedgerModule, WorkOrderModule],
  controllers: [FgReceiptController],
  providers: [FgReceiptService],
  exports: [FgReceiptService],
})
export class FgReceiptModule {}
