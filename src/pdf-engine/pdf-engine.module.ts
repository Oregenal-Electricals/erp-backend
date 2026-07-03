import { Module } from '@nestjs/common';
import { PdfEngineController } from './pdf-engine.controller';
import { PdfEngineService } from './pdf-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PdfEngineController],
  providers: [PdfEngineService],
  exports: [PdfEngineService],
})
export class PdfEngineModule {}
