import { Module } from '@nestjs/common';
import { ShippingDocumentController } from './shipping-document.controller';
import { ShippingDocumentService } from './shipping-document.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ShippingDocumentController],
  providers: [ShippingDocumentService],
  exports: [ShippingDocumentService],
})
export class ShippingDocumentModule {}
