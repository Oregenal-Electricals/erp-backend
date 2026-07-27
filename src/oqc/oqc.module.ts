import { Module } from '@nestjs/common';
import { OqcController } from './oqc.controller';
import { OqcService } from './oqc.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { StockLedgerModule } from '../stock-ledger/stock-ledger.module';

@Module({
  imports: [PrismaModule, CommonModule, StockLedgerModule],
  controllers: [OqcController],
  providers: [OqcService],
  exports: [OqcService],
})
export class OqcModule {}
