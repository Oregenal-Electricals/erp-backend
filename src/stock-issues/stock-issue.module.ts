import { Module } from '@nestjs/common';
import { StockIssueController } from './stock-issue.controller';
import { StockIssueService } from './stock-issue.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { StockLedgerModule } from '../stock-ledger/stock-ledger.module';

@Module({
  imports: [PrismaModule, CommonModule, StockLedgerModule],
  controllers: [StockIssueController],
  providers: [StockIssueService],
  exports: [StockIssueService],
})
export class StockIssueModule {}
