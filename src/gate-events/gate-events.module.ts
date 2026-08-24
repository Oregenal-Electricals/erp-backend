import { Module } from '@nestjs/common';
import { GateEventsController } from './gate-events.controller';
import { GateEventsService } from './gate-events.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [GateEventsController],
  providers: [GateEventsService],
  exports: [GateEventsService],
})
export class GateEventsModule {}
