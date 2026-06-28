import { Module } from '@nestjs/common';
import { StockPutawayController } from './stock-putaway.controller';
import { StockPutawayService } from './stock-putaway.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { StockLedgerModule } from '../stock-ledger/stock-ledger.module';

@Module({
  imports: [PrismaModule, CommonModule, StockLedgerModule],
  controllers: [StockPutawayController],
  providers: [StockPutawayService],
  exports: [StockPutawayService],
})
export class StockPutawayModule {}
