import { Module } from '@nestjs/common';
import { HoldStockController } from './hold-stock.controller';
import { HoldStockService } from './hold-stock.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { StockLedgerModule } from '../stock-ledger/stock-ledger.module';
import { RejectedStockModule } from '../rejected-stock/rejected-stock.module';

@Module({
  imports: [PrismaModule, CommonModule, StockLedgerModule, RejectedStockModule],
  controllers: [HoldStockController],
  providers: [HoldStockService],
  exports: [HoldStockService],
})
export class HoldStockModule {}
