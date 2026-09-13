import { Module } from '@nestjs/common';
import { ProductionMaterialReturnController } from './production-material-return.controller';
import { ProductionMaterialReturnService } from './production-material-return.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { StockLedgerModule } from '../stock-ledger/stock-ledger.module';
import { StockLocationBalanceModule } from '../stock-location-balance/stock-location-balance.module';

@Module({
  imports: [PrismaModule, CommonModule, StockLedgerModule, StockLocationBalanceModule],
  controllers: [ProductionMaterialReturnController],
  providers: [ProductionMaterialReturnService],
  exports: [ProductionMaterialReturnService],
})
export class ProductionMaterialReturnModule {}
