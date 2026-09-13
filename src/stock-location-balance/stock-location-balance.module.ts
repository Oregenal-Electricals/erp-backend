import { Module } from '@nestjs/common';
import { StockLocationBalanceService } from './stock-location-balance.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StockLocationBalanceService],
  exports: [StockLocationBalanceService],
})
export class StockLocationBalanceModule {}
