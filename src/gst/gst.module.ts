import { Module } from '@nestjs/common';
import { GstController } from './gst.controller';
import { GstService } from './gst.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [GstController],
  providers: [GstService],
  exports: [GstService],
})
export class GstModule {}
