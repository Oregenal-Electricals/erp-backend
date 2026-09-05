import { Module } from '@nestjs/common';
import { StoreReceivingController } from './store-receiving.controller';
import { StoreReceivingService } from './store-receiving.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { GateInwardModule } from '../gate-inward/gate-inward.module';

@Module({
  imports: [PrismaModule, CommonModule, GateInwardModule],
  controllers: [StoreReceivingController],
  providers: [StoreReceivingService],
  exports: [StoreReceivingService],
})
export class StoreReceivingModule {}
