import { Module } from '@nestjs/common';
import { BomImportController } from './bom-import.controller';
import { BomImportService } from './bom-import.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { BomModule } from '../bom/bom.module';

@Module({
  imports: [PrismaModule, CommonModule, BomModule],
  controllers: [BomImportController],
  providers: [BomImportService],
})
export class BomImportModule {}
