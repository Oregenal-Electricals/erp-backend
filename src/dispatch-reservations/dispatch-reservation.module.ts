import { Module } from '@nestjs/common';
import { DispatchReservationController } from './dispatch-reservation.controller';
import { DispatchReservationService } from './dispatch-reservation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DispatchReservationController],
  providers: [DispatchReservationService],
  exports: [DispatchReservationService],
})
export class DispatchReservationModule {}
