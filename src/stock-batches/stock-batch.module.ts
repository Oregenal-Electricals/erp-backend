import { Module } from '@nestjs/common';
import { StockBatchController } from './stock-batch.controller';
import { StockBatchService } from './stock-batch.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [StockBatchController],
  providers: [StockBatchService],
  exports: [StockBatchService],
})
export class StockBatchModule {}
