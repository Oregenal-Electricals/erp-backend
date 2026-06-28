import { Module } from '@nestjs/common';
import { ProductionEntryController } from './production-entry.controller';
import { ProductionEntryService } from './production-entry.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ProductionEntryController],
  providers: [ProductionEntryService],
  exports: [ProductionEntryService],
})
export class ProductionEntryModule {}
