import { Module } from '@nestjs/common';
import { DispatchLoadingController } from './dispatch-loading.controller';
import { DispatchLoadingService } from './dispatch-loading.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DispatchLoadingController],
  providers: [DispatchLoadingService],
  exports: [DispatchLoadingService],
})
export class DispatchLoadingModule {}
