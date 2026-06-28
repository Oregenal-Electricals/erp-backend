import { Module } from '@nestjs/common';
import { StockReportsController } from './stock-reports.controller';
import { StockReportsService } from './stock-reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [StockReportsController],
  providers: [StockReportsService],
  exports: [StockReportsService],
})
export class StockReportsModule {}
