import { Module } from '@nestjs/common';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
