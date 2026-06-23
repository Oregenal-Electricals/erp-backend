import { Module } from '@nestjs/common';
import { QuotationComparisonController } from './quotation-comparison.controller';
import { QuotationComparisonService } from './quotation-comparison.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [QuotationComparisonController],
  providers: [QuotationComparisonService],
  exports: [QuotationComparisonService],
})
export class QuotationComparisonModule {}
