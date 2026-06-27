import { Module } from '@nestjs/common';
import { CustomsEntryController } from './customs-entry.controller';
import { CustomsEntryService } from './customs-entry.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CustomsEntryController],
  providers: [CustomsEntryService],
  exports: [CustomsEntryService],
})
export class CustomsEntryModule {}
