import { Module } from '@nestjs/common';
import { NcrController } from './ncr.controller';
import { NcrService } from './ncr.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [NcrController],
  providers: [NcrService],
  exports: [NcrService],
})
export class NcrModule {}
