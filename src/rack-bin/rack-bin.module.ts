import { Module } from '@nestjs/common';
import { RackBinController } from './rack-bin.controller';
import { RackBinService } from './rack-bin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [RackBinController],
  providers: [RackBinService],
  exports: [RackBinService],
})
export class RackBinModule {}
