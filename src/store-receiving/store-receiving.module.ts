import { Module } from '@nestjs/common';
import { StoreReceivingController } from './store-receiving.controller';
import { StoreReceivingService } from './store-receiving.service';
import { PhysicalVerificationService } from './physical-verification.service';
import { StoreShortageService } from './store-shortage.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { GateInwardModule } from '../gate-inward/gate-inward.module';

@Module({
  imports: [PrismaModule, CommonModule, GateInwardModule, NotificationsModule],
  controllers: [StoreReceivingController],
  providers: [StoreReceivingService, PhysicalVerificationService, StoreShortageService],
  exports: [StoreReceivingService, PhysicalVerificationService, StoreShortageService],
})
export class StoreReceivingModule {}
