import { Module } from '@nestjs/common';
import { VendorQuotationController } from './vendor-quotation.controller';
import { VendorQuotationService } from './vendor-quotation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [VendorQuotationController],
  providers: [VendorQuotationService],
  exports: [VendorQuotationService],
})
export class VendorQuotationModule {}
