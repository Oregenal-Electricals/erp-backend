import { Module } from '@nestjs/common';
import { CostSheetController } from './cost-sheet.controller';
import { CostSheetService } from './cost-sheet.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CostSheetController],
  providers: [CostSheetService],
  exports: [CostSheetService],
})
export class CostSheetModule {}
