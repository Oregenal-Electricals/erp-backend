import { Module } from '@nestjs/common';
import { RejectedStockController } from './rejected-stock.controller';
import { RejectedStockService } from './rejected-stock.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [RejectedStockController],
  providers: [RejectedStockService],
  exports: [RejectedStockService],
})
export class RejectedStockModule {}
