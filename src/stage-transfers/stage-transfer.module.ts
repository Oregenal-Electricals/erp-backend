import { Module } from '@nestjs/common';
import { StageTransferController } from './stage-transfer.controller';
import { StageTransferService } from './stage-transfer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [StageTransferController],
  providers: [StageTransferService],
  exports: [StageTransferService],
})
export class StageTransferModule {}
