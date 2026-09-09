import { Module } from '@nestjs/common';
import { ProductSellingPriceController } from './product-selling-price.controller';
import { ProductSellingPriceService } from './product-selling-price.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ProductSellingPriceController],
  providers: [ProductSellingPriceService],
  exports: [ProductSellingPriceService],
})
export class ProductSellingPriceModule {}
