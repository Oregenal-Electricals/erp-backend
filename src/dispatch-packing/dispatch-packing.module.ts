import { Module } from '@nestjs/common';
import { DispatchPackingController } from './dispatch-packing.controller';
import { DispatchPackingService } from './dispatch-packing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DispatchPackingController],
  providers: [DispatchPackingService],
  exports: [DispatchPackingService],
})
export class DispatchPackingModule {}
