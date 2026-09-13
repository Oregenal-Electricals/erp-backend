import { Module } from '@nestjs/common';
import { StockLocationTransferController } from './stock-location-transfer.controller';
import { StockLocationTransferService } from './stock-location-transfer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { StockLocationBalanceModule } from '../stock-location-balance/stock-location-balance.module';

@Module({
  imports: [PrismaModule, CommonModule, StockLocationBalanceModule],
  controllers: [StockLocationTransferController],
  providers: [StockLocationTransferService],
  exports: [StockLocationTransferService],
})
export class StockLocationTransferModule {}
