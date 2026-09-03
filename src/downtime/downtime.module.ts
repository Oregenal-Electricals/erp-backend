import { Module } from '@nestjs/common';
import { DowntimeController } from './downtime.controller';
import { DowntimeService } from './downtime.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DowntimeController],
  providers: [DowntimeService],
  exports: [DowntimeService],
})
export class DowntimeModule {}
