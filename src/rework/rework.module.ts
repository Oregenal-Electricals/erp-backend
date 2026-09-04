import { Module } from '@nestjs/common';
import { ReworkController } from './rework.controller';
import { ReworkService } from './rework.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SettingsModule } from '../settings/settings.module';
@Module({
  imports: [PrismaModule, CommonModule, SettingsModule],
  controllers: [ReworkController],
  providers: [ReworkService],
  exports: [ReworkService],
})
export class ReworkModule {}
