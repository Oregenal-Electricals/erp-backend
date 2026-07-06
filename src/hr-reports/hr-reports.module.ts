import { Module } from '@nestjs/common';
import { HrReportsController } from './hr-reports.controller';
import { HrReportsService } from './hr-reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [HrReportsController],
  providers: [HrReportsService],
  exports: [HrReportsService],
})
export class HrReportsModule {}
