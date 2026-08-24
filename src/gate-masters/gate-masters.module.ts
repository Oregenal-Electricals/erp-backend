import { Module } from '@nestjs/common';
import { GateMastersController } from './gate-masters.controller';
import { GateMastersService } from './gate-masters.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [GateMastersController],
  providers: [GateMastersService],
  exports: [GateMastersService],
})
export class GateMastersModule {}
