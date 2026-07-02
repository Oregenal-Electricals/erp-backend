import { Module } from '@nestjs/common';
import { DeliveryConfirmationController } from './delivery-confirmation.controller';
import { DeliveryConfirmationService } from './delivery-confirmation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DeliveryConfirmationController],
  providers: [DeliveryConfirmationService],
  exports: [DeliveryConfirmationService],
})
export class DeliveryConfirmationModule {}
