import { Module } from '@nestjs/common';
import { ProformaInvoiceController } from './proforma-invoice.controller';
import { ProformaInvoiceService } from './proforma-invoice.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ProformaInvoiceController],
  providers: [ProformaInvoiceService],
  exports: [ProformaInvoiceService],
})
export class ProformaInvoiceModule {}
