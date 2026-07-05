import { Module } from '@nestjs/common';
import { TdsController } from './tds.controller';
import { TdsService } from './tds.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [TdsController],
  providers: [TdsService],
  exports: [TdsService],
})
export class TdsModule {}
