import { Module } from '@nestjs/common';
import { StockLedgerController } from './stock-ledger.controller';
import { StockLedgerService } from './stock-ledger.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { CustomerPoModule } from '../customer-po/customer-po.module';

@Module({
  imports: [PrismaModule, CommonModule, CustomerPoModule],
  controllers: [StockLedgerController],
  providers: [StockLedgerService],
  exports: [StockLedgerService],
})
export class StockLedgerModule {}
