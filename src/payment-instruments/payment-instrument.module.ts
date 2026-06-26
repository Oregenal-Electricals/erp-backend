import { Module } from '@nestjs/common';
import { PaymentInstrumentController } from './payment-instrument.controller';
import { PaymentInstrumentService } from './payment-instrument.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PaymentInstrumentController],
  providers: [PaymentInstrumentService],
  exports: [PaymentInstrumentService],
})
export class PaymentInstrumentModule {}
