import { Module } from '@nestjs/common';
import { DispatchTrackingController } from './dispatch-tracking.controller';
import { DispatchTrackingService } from './dispatch-tracking.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DispatchTrackingController],
  providers: [DispatchTrackingService],
  exports: [DispatchTrackingService],
})
export class DispatchTrackingModule {}
