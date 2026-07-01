import { Module } from '@nestjs/common';
import { QualityReportsController } from './quality-reports.controller';
import { QualityReportsService } from './quality-reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [QualityReportsController],
  providers: [QualityReportsService],
})
export class QualityReportsModule {}
