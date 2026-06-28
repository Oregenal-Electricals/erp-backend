import { Module } from '@nestjs/common';
import { ProductionIssueController } from './production-issue.controller';
import { ProductionIssueService } from './production-issue.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { StockLedgerModule } from '../stock-ledger/stock-ledger.module';
import { MrpModule } from '../mrp/mrp.module';

@Module({
  imports: [PrismaModule, CommonModule, StockLedgerModule, MrpModule],
  controllers: [ProductionIssueController],
  providers: [ProductionIssueService],
  exports: [ProductionIssueService],
})
export class ProductionIssueModule {}
