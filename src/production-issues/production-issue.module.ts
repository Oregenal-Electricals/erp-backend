import { Module } from '@nestjs/common';
import { ProductionIssueController } from './production-issue.controller';
import { ProductionIssueService } from './production-issue.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { StockLedgerModule } from '../stock-ledger/stock-ledger.module';
import { MrpModule } from '../mrp/mrp.module';
import { ProductionMaterialReturnModule } from '../production-material-return/production-material-return.module';
import { MaterialIssueOverrideModule } from '../material-issue-override/material-issue-override.module';

@Module({
  imports: [PrismaModule, CommonModule, StockLedgerModule, MrpModule, ProductionMaterialReturnModule, MaterialIssueOverrideModule],
  controllers: [ProductionIssueController],
  providers: [ProductionIssueService],
  exports: [ProductionIssueService],
})
export class ProductionIssueModule {}
