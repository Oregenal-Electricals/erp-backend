import { Module } from '@nestjs/common';
import { RawMaterialController } from './raw-material.controller';
import { RawMaterialService } from './raw-material.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [RawMaterialController],
  providers: [RawMaterialService],
  exports: [RawMaterialService],
})
export class RawMaterialModule {}
